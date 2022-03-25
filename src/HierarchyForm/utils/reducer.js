// Third party packages
import { isArray, isEmpty, findLastIndex } from 'lodash'

import { getLevelWiseObject } from './common'

// re-index resp. level and child levels array
const reIndexClosure = ( { state, config, rootLevelKey, isRootLevel, isRemoveAction = false } ) => {
    let isReIndexed = false

    const recursive = ( {
        levelKey,
        newOid = null,
        newRootOid = null,
        parentIndex = null,
        oldParentUniqueKey,
        isRecursive = false,
        newParentUniqueKey = null,
    } ) => {
        if ( !levelKey )
            return

        const tmpArr = state[ levelKey ]
        const childKey = config[ levelKey ][ 'childKey' ]

        const filteredTmpArr = tmpArr.filter( v => oldParentUniqueKey === v.parentUniqueKey )

        if ( !filteredTmpArr.length )
            return

        for ( let i = 0; i < filteredTmpArr.length; i++ ) {
            const object = filteredTmpArr[ i ]

            const { oid, isAdd, uniqueKey, isValueUnknown } = object
            const tmpUniqueKey = isRecursive ? newParentUniqueKey : oldParentUniqueKey
            const newUniqueKey = tmpUniqueKey ? `${ tmpUniqueKey }__${ levelKey }-${ i }` : `${ levelKey }-${ i }`

            object.currentIndex = i
            object.uniqueKey = newUniqueKey
            object.parentUniqueKey = tmpUniqueKey
            object.oid = isAdd ? newUniqueKey : oid

            if ( isRemoveAction ) {
                if ( rootLevelKey === levelKey && isRootLevel ) {
                    object.oid = isValueUnknown ? newUniqueKey : oid
                    object.rootOid = isValueUnknown ? newUniqueKey : oid
                } else {
                    object.parentOid = newOid
                    object.rootOid = newRootOid
                }
            }

            if ( isRecursive )
                object.parentIndex = parentIndex

            // always set current object or first root element as re-indexed to avoid iterating other loop elements while updating parent state
            if ( !isReIndexed ) {
                if ( isRootLevel ) {
                    isReIndexed = true

                    object.isReIndexed = isReIndexed
                } else if ( state?.[ rootLevelKey ]?.length ) {
                    isReIndexed = true

                    state[ rootLevelKey ][ 0 ].isReIndexed = isReIndexed
                }
            }

            if ( childKey )
                recursive( {
                    parentIndex: i,
                    isRecursive: true,
                    levelKey: childKey,
                    newOid: object.oid,
                    newRootOid: object.rootOid,
                    oldParentUniqueKey: uniqueKey,
                    newParentUniqueKey: newUniqueKey,
                } )
        }
    }

    return recursive
}

const removeChildrenClosure = ( state, config ) => {
    // remove child elements from main object recursively
    const recursive = ( { childKey, parentUniqueKey } ) => {
        if ( !childKey )
            return

        const tmpChildKey = config[ childKey ][ 'childKey' ]

        const tmpChildArr = state[ childKey ] || []

        let filteredTmpChildArr = tmpChildArr.filter( v => parentUniqueKey !== v.parentUniqueKey )

        state[ childKey ] = [ ...filteredTmpChildArr ]

        if ( tmpChildKey && tmpChildArr.length ) {
            filteredTmpChildArr = tmpChildArr.filter( v => parentUniqueKey === v.parentUniqueKey )

            for ( let i = 0; i < filteredTmpChildArr.length; i++ )
                recursive( {
                    childKey: tmpChildKey,
                    parentUniqueKey: filteredTmpChildArr[ i ].uniqueKey,
                } )
        }
    }

    return recursive
}

// change oid of current level and resp. child levels array
const changeClosure = ( state, config, payload ) => {
    const {
        oid,
        label,
        levelKey,
        uniqueKey,
        findIndex,
        isRootLevel,
        isValueCleared,
    } = payload

    let tmpArr = state[ levelKey ] || []
    const object = tmpArr[ findIndex ]

    object.name = label
    object.isValidate = true
    object.isValueUnknown = isValueCleared
    object.oid = isValueCleared ? uniqueKey : oid

    if ( isRootLevel )
        object.rootOid = isValueCleared ? uniqueKey : oid

    const recursive = ( levelKey, uniqueKey, isRemoveAddObject = false ) => {
        if ( !levelKey || !uniqueKey )
            return

        const childKey = config[ levelKey ][ 'childKey' ]

        if ( !childKey )
            return

        tmpArr = state[ childKey ] || []

        if ( !tmpArr.length )
            return

        let filteredTmpChildArr = tmpArr.filter( v => ( uniqueKey !== v[ 'parentUniqueKey' ] || ( !isRemoveAddObject && v.isAdd ) ) )

        state[ childKey ] = filteredTmpChildArr

        filteredTmpChildArr = tmpArr.filter( v => ( uniqueKey === v[ 'parentUniqueKey' ] ) )

        if ( !filteredTmpChildArr.length )
            return

        for ( let i = 0; i < filteredTmpChildArr.length; i++ ) {
            const childObject = filteredTmpChildArr[ i ]

            if ( !childObject.isAdd )
                recursive( childKey, filteredTmpChildArr[ i ].uniqueKey, true )
            else {
                childObject.parentOid = isValueCleared ? childObject.parentUniqueKey : oid

                if ( isRootLevel )
                    childObject.rootOid = isValueCleared ? childObject.parentUniqueKey : oid
            }
        }
    }

    return recursive
}

export const reducer = ( state, { type, payload, config, rootLevelKey } ) => {
    const {
        oid, rootOid, parentOid,
        parentIndex, currentIndex,
        parentUniqueKey, uniqueKey,
        levelKey, childKey, parentKey,
        label, isRootLevel, isValueCleared,
    } = payload

    if ( isEmpty( state ) )
        return state

    let newState = Object.assign( {}, state )

    if ( ( !isValueCleared && !oid ) || !levelKey || !uniqueKey )
        return newState

    let tmpArr = newState[ levelKey ] || []
    const findIndex = tmpArr.findIndex( a => uniqueKey === a.uniqueKey )

    switch ( type ) {
        case 'REMOVE':
            // remove element from resp. level
            if ( findIndex !== -1 ) {
                if ( childKey )
                    // state being passed as reference so no need to return it
                    // but in future if the state mutations are not reflecting we can just return it as a complete new object and assign it to newState variable defined in this reducer context above
                    removeChildrenClosure( newState, config )( { childKey, parentUniqueKey: uniqueKey } )

                tmpArr.splice( findIndex, 1 )
            }

            // remove element oid from parent object
            tmpArr = newState[ parentKey ] || []

            if ( tmpArr.length && !isEmpty( tmpArr[ parentIndex ] && isArray( tmpArr[ parentIndex ][ levelKey ] ) ) )
                currentIndex !== -1 && tmpArr[ parentIndex ][ levelKey ].splice( currentIndex, 1 )

            // state being passed as reference so no need to return it
            // but in future if the state mutations are not reflecting we can just return it as a complete new object and assign it to newState variable defined in this reducer context above
            reIndexClosure( {
                config,
                isRootLevel,
                rootLevelKey,
                state: newState,
                isRemoveAction: true,
            } )( {
                levelKey,
                oldParentUniqueKey: parentUniqueKey
            } )

            return { ...newState }

        // NOTE: Don't delete the commented code till the generic Hierarchy based component is stable
        case 'ADD':
            if ( findIndex !== -1 ) {
                const object = tmpArr[ findIndex ]

                object.isAdd = false

                const newIndex = parseInt( currentIndex ) + 1
                const tmpUniqueLevelKey = `${ levelKey }-${ newIndex }`
                const tmpLevelObject = getLevelWiseObject( {
                    parentOid,
                    parentKey,
                    parentIndex,
                    isAdd: true,
                    parentUniqueKey,
                    currentIndex: newIndex,
                    rootOid: isRootLevel ? tmpUniqueLevelKey : rootOid,
                    uniqueKey: isRootLevel ? tmpUniqueLevelKey : `${ parentUniqueKey }__${ tmpUniqueLevelKey }`,
                } )

                tmpArr.splice( findIndex + 1, 0, tmpLevelObject )

                // add child level object
                if ( childKey ) {
                    tmpArr = newState[ childKey ] || []

                    const findChildLastIndex = findLastIndex( tmpArr, v => rootOid === v[ 'rootOid' ] )

                    // if ( isArray( tmpArr ) ) {
                    const tmpChildLevelObject = getLevelWiseObject( {
                        rootOid,
                        childKey,
                        uniqueKey,
                        isAdd: true,
                        parentOid: oid,
                        parentKey: levelKey,
                        isAddChildLevel: true,
                        parentIndex: currentIndex,
                        parentUniqueKey: uniqueKey,
                    } )

                    // trival equation but works good only for root level
                    const position = isRootLevel ? tmpArr.length : findChildLastIndex + 1

                    tmpArr.splice( position, 0, tmpChildLevelObject )
                    // }
                }

                const rootTmpArr = state[ rootLevelKey ]

                // rest all rootLevel elements as not re-indexed to avoid updating parent state
                for ( let i = 0; i < rootTmpArr.length; i++ )
                    rootTmpArr[ i ].isReIndexed = false
            }

            return { ...newState }

        case 'CHANGE':
            // state being passed as reference so no need to return it
            // but in future if the state mutations are not reflecting we can just return it as a complete new object and assign it to newState variable defined in this reducer context above
            if ( findIndex !== -1 ) {
                changeClosure( newState, config, {
                    oid,
                    label,
                    levelKey,
                    uniqueKey,
                    findIndex,
                    isRootLevel,
                    isValueCleared,
                } )( levelKey, uniqueKey )

                reIndexClosure( {
                    config,
                    isRootLevel,
                    rootLevelKey,
                    state: newState,
                } )( {
                    levelKey,
                    oldParentUniqueKey: parentUniqueKey
                } )
            }

            return { ...newState }

        default:
            return newState
    }
}
