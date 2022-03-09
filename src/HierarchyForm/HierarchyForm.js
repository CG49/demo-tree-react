import React, { createRef, useReducer } from 'react'

// External Libraries
import { isArray, isEmpty, findLastIndex } from 'lodash'

// components
import { Level } from './Level'
import { Ladder } from './Ladder'

// utils
import { getLevelWiseObject } from './utils'

// css
import './scss/HierarchyForm.scss'

// re-index resp. level and child levels array
const reIndexClosure = ( state, config ) => {
	const recursive = ( {
		levelKey,
		oldParentUniqueKey,
		parentIndex = null,
		isRecursive = false,
		newParentUniqueKey = null
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

			const { oid, isAdd, uniqueKey } = object
			const tmpUniqueKey = isRecursive ? newParentUniqueKey : oldParentUniqueKey
			const newUniqueKey = tmpUniqueKey ? `${ tmpUniqueKey }__${ levelKey }-${ i }` : `${ levelKey }-${ i }`

			object.currentIndex = i
			object.uniqueKey = newUniqueKey
			object.parentUniqueKey = tmpUniqueKey
			object.oid = isAdd ? newUniqueKey : oid

			if ( isRecursive )
				object.parentIndex = parentIndex

			if ( childKey )
				recursive( {
					parentIndex: i,
					isRecursive: true,
					levelKey: childKey,
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

		const tmpChildArr = state[ childKey ]

		let filteredTmpChildArr = ( tmpChildArr || [] ).filter( v => parentUniqueKey !== v.parentUniqueKey )

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
		findIndex,
		isRootLevel,
	} = payload

	let tmpArr = state[ levelKey ]
	const object = tmpArr[ findIndex ]

	object.oid = oid
	object.name = label
	object.isValidate = true
	object.isValueUnknown = false

	if ( isRootLevel )
		object.rootOid = oid

	const recursive = ( levelKey, uniqueKey, isRemoveAddObject = false ) => {
		if ( !levelKey || !uniqueKey )
			return

		const childKey = config[ levelKey ][ 'childKey' ]

		if ( !childKey )
			return

		tmpArr = state[ childKey ]

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
				childObject.parentOid = oid

				if ( isRootLevel )
					childObject.rootOid = oid
			}
		}
	}

	return recursive
}

const reducer = ( state, { type, payload, config } ) => {
	const {
		label, isRootLevel,
		oid, rootOid, parentOid,
		parentIndex, currentIndex,
		parentUniqueKey, uniqueKey,
		levelKey, childKey, parentKey,
	} = payload

	if ( isEmpty( state ) )
		return state

	let newState = Object.assign( {}, state )

	if ( !oid || !levelKey || !uniqueKey )
		return newState

	let tmpArr = newState[ levelKey ]
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
			reIndexClosure( newState, config )( { levelKey, oldParentUniqueKey: parentUniqueKey } )

			return { ...newState }

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
					isRootLevel,
					isAdd: true,
					parentUniqueKey,
					currentIndex: newIndex,
					rootOid: isRootLevel ? tmpUniqueLevelKey : rootOid,
					uniqueKey: isRootLevel ? tmpUniqueLevelKey : `${ parentUniqueKey }__${ tmpUniqueLevelKey }`,
				} )

				tmpArr.splice( findIndex + 1, 0, tmpLevelObject )

				// add child level object
				if ( childKey ) {
					tmpArr = newState[ childKey ]

					const findChildLastIndex = findLastIndex( tmpArr, v => rootOid === v[ 'rootOid' ] )

					if ( isArray( tmpArr ) ) {
						const tmpChildLevelObject = getLevelWiseObject( {
							rootOid,
							childKey,
							uniqueKey,
							isRootLevel,
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
					}
				}
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
					findIndex,
					isRootLevel,
				} )( levelKey, uniqueKey )

				reIndexClosure( newState, config )( { levelKey, oldParentUniqueKey: parentUniqueKey } )
			}

			return { ...newState }

		default:
			return newState
	}
}

export const HierarchyForm = ( {
	title,
	config,
	globalStore,
	rootLevelKey,
	formInitState = {},
} ) => {
	const [ reducerState, dispatch ] = useReducer( reducer, null, () => formInitState )

	const refs = {}
	const childElements = {}
	const parentElements = {}

	const handleOnChange = React.useCallback( ( actionType, payload ) => {
		dispatch( {
			config,
			payload,
			type: actionType,
		} )
		// eslint-disable-next-line
	}, [] )

	const handleOnClick = React.useCallback( ( actionType, payload ) => {
		dispatch( {
			config,
			payload,
			type: actionType,
		} )
		// eslint-disable-next-line
	}, [] )

	const getElementRecursive = ( levelKey, levelArr = [] ) => {
		if ( !levelKey )
			return

		const {
			id, childKey, parentKey, styles,
			isRootLevel = false, label = '', buttonText = '',
		} = config[ levelKey ] || {}

		// needed a tmpArray of oids for removing already selected values from dropdown
		const tmpOids = []
		for ( let i = 0; i < levelArr.length; i++ ) {
			const { isAdd, oid } = levelArr[ i ]

			if ( !isAdd )
				tmpOids.push( oid )
		}

		for ( let i = 0; i < levelArr.length; i++ ) {
			const value = levelArr[ i ] || {}
			let globalLevelData = globalStore[ id ] || []

			const {
				oid,
				isAdd,
				rootOid,
				uniqueKey,
			} = value

			// remove already selected values from dropdown
			const filteredTmpOids = tmpOids.filter( v => oid !== v )

			globalLevelData = globalLevelData.filter( v => !filteredTmpOids.includes( v.oid ) )

			// filter sub-level options based on root level ( may be need to remove below filtering )
			if ( !isRootLevel )
				globalLevelData = globalLevelData.filter( v => rootOid === v[ 'rootOid' ] )

			const tmpUniqueKey = isAdd ? uniqueKey : `${ uniqueKey }.${ oid }`
			const defaultValue = isAdd ? null : globalLevelData.find( v => oid === v.oid )

			refs[ uniqueKey ] = createRef()

			const element = (
				<Level
					key={ tmpUniqueKey }
					ref={ refs[ uniqueKey ] }
					isRootLevel={ isRootLevel }
					options={ {
						...value,
						styles,
						childKey,
						levelKey,
						parentKey,
						rootLevelKey,
						defaultValue,
						handleOnClick,
						handleOnChange,
						globalLevelData,
						placeholder: label,
						// handleOnClickCollapsible,
						buttonText: isAdd ? label : buttonText,
					} }
				/>
			)

			if ( !isRootLevel )
				childElements[ rootOid ] = [
					...( childElements[ rootOid ] || [] ),
					element,
				]
			else
				parentElements[ rootOid ] = [
					...( parentElements[ rootOid ] || [] ),
					element,
				]

			const childrenLevelArr = ( reducerState[ childKey ] || [] ).filter( elem => uniqueKey === elem.parentUniqueKey )

			if ( childrenLevelArr.length )
				getElementRecursive( childKey, childrenLevelArr )
		}
	}

	if ( !isEmpty( reducerState ) )
		getElementRecursive( rootLevelKey, reducerState[ rootLevelKey ] )

	return (
		<div id={ rootLevelKey }>
			{/* Title */ }
			<span className='title'>{ title }</span>

			{ !isEmpty( parentElements ) &&
				<Ladder
					childElements={ childElements }
					parentElements={ parentElements }
				/>
			}
		</div>
	)
}

// const Collapsible = ( { children, isOpen = true } ) => {
// 	return <Collapse in={ isOpen }>
// 		<div>
// 			{ children }
// 		</div>
// 	</Collapse>
// }


// const handleOnClickCollapsible = React.useCallback( ( { rootOid } ) => {
// 	// Change the collapsible icon
// 	// ...

// 	setCollapsibleState( prevState => {
// 		const stateIsOpen = typeof prevState[ rootOid ] === 'undefined' ? true : prevState[ rootOid ]

// 		return {
// 			...prevState,
// 			[ rootOid ]: !stateIsOpen,
// 		}
// 	} )
// 	eslint-disable-next-line
// }, [] )

// 	for ( const rootOid in parentElements ) {
// 		elements.push( parentElements[ rootOid ] )

// 		// const stateIsOpen = typeof collapsibleState[ rootOid ] === 'undefined' ? true : collapsibleState[ rootOid ]

// 		elements.push(
// 			<Collapsible key={ rootOid } isOpen={ true }>
// 				{ childElements[ rootOid ] }
// 			</Collapsible>
// 		)
// 	}