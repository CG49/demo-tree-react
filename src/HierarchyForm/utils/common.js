// Third party packages
import { isEmpty, groupBy } from 'lodash'

// NOTE:
// 1. Don't mess with below function
// 2. Don't delete the commented code till the generic Hierarchy based component is stable
export const getLevelWiseObject = ( {
  isAdd = false,
  rootOid = null,
  childKey = null,
  currentIndex = 0,
  parentOid = null,
  parentIndex = null,
  parentUniqueKey = null,
  isAddChildLevel = false,
  uniqueKey = 'uniqueKey-0',
  ...rest
} ) => ( {
  isAdd,
  rootOid,
  parentIndex,
  currentIndex,
  parentUniqueKey,
  isValidate: !isAdd,
  isValueUnknown: isAdd,
  parentOid: !parentOid && childKey ? uniqueKey : parentOid,
  // childKey: isAddChildLevel && !childKey ? null : childKey,
  oid: childKey ? `${ uniqueKey }__${ [ childKey ] }-${ currentIndex }` : `${ uniqueKey }`, // gets replaced if oid is present in ...rest
  uniqueKey: childKey ? `${ uniqueKey }__${ [ childKey ] }-${ currentIndex }` : `${ uniqueKey }`,
  ...rest,
} )

// NOTE:
// 1. Don't mess with below function
// 2. Don't delete the commented code till the generic Hierarchy based component is stable
export const prepareGlobalStoreData = ( config, globalStore ) => {
  if ( isEmpty( config ) )
    throw new Error( 'Failed to load config object' )

  const data = {}

  for ( const key in config )
    data[ key ] = []

  if ( isEmpty( globalStore ) )
    return data

  // i refers to id in config e.g.: PRODUCTS, PLANS or BLOB, CLIENTS, LOCATIONS, etc.
  for ( const i in globalStore ) {
    // j refers to each original object for corresponding id in globalStore array e.g.: 
    for ( let j = 0; j < globalStore[ i ].length; j++ ) {
      const object = {}
      const globalDataKeys = config[ i ][ 'globalDataKeys' ]

      // k refers to key thats needs to be extracted from original object in globalStore array
      for ( const k in globalDataKeys ) {
        const value = globalStore[ i ][ j ][ globalDataKeys[ k ] ] || null

        Object.assign( object, { [ k ]: value } )
      }

      data[ config[ i ][ 'id' ] ] = [
        ...( data[ config[ i ][ 'id' ] ] || [] ),
        object,
      ]
    }
  }

  return data
}

// NOTE:
// 1. Don't mess with below function
// 2. Don't delete the commented code till the generic Hierarchy based component is stable
export const prepareFormState = ( config, levelKey, arr = [] ) => {
  if ( isEmpty( config ) )
    throw new Error( 'Failed to load config object' )

  const data = {}

  for ( const key in config )
    data[ key ] = []

  if ( !levelKey )
    return data

  const outerRecursive = ( levelKey, levelArr, prevObject = {} ) => {
    const { dataKeys, childKey = null, parentKey = null, isRootLevel = false } = config[ levelKey ] || {}
    const { oid, name, childAPIKey } = dataKeys || {}

    const {
      rootOid,
      oid: parentOid,
      currentIndex: parentIndex,
      uniqueKey: parentUniqueKey,
    } = prevObject || {}

    for ( let i = 0; i < levelArr.length; i++ ) {
      let childrens = []

      const tmpOid = levelArr[ i ][ oid ]
      const tmpName = levelArr[ i ][ name ]
      const tmpRootOid = rootOid ? rootOid : levelArr[ i ][ oid ]

      if ( !tmpOid )
        continue

      if ( childAPIKey )
        childrens = ( levelArr[ i ][ childAPIKey ] || [] )

      let tmpUniqueKey = `${ [ config[ levelKey ].id ] }-${ i }`

      tmpUniqueKey = parentUniqueKey ? `${ parentUniqueKey }__${ tmpUniqueKey }` : tmpUniqueKey

      let object = getLevelWiseObject( {
        parentKey,
        parentOid,
        oid: tmpOid,
        name: tmpName,
        currentIndex: i,
        parentUniqueKey,
        parentIndex,
        uniqueKey: tmpUniqueKey,
        rootOid: isRootLevel ? tmpOid : rootOid,
      } )

      if ( childKey )
        object[ childKey ] = []

      if ( childrens.length ) {
        // not needed so disabled temporarily
        // logic to add children oids from main object to parent object as an array
        // const innerRecursive = ( childKey, childrens ) => {
        //   const {
        //     dataKeys,
        //     // childKey: nestedChildKey = null,
        //   } = config[ childKey ] || {}
        //   const {
        //     oid,
        //     // childAPIKey,
        //   } = dataKeys || {}

        //   // if ( nestedChildKey )
        //   // 	object[ nestedChildKey ] = []

        //   for ( let j = 0; j < childrens.length; j++ ) {
        //     // let tmpChildrens = []
        //     const tmpOid = childrens[ j ][ oid ]

        //     if ( !tmpOid )
        //       continue

        //     // if ( childAPIKey )
        //     // 	tmpChildrens = ( childrens[ j ][ childAPIKey ] || [] )

        //     object[ childKey ] = [
        //       ...( object[ childKey ] || [] ),
        //       tmpOid,
        //     ]

        //     // logic to add nested children oids from main object to root parent object as an array
        //     // if ( tmpChildrens.length )
        //     // 	innerRecursive( nestedChildKey, tmpChildrens )
        //   }
        // }

        // innerRecursive( childKey, childrens )

        outerRecursive( childKey, childrens, object, tmpUniqueKey )
      }

      data[ levelKey ] = [
        ...( data[ levelKey ] || [] ),
        object,
      ]

      if ( !childrens.length && childKey ) {
        // logic to add child object as default if no childrens but childKey present
        data[ childKey ] = [
          ...( data[ childKey ] || [] ),
          getLevelWiseObject( {
            childKey,
            name: 'ADD',
            isAdd: true,
            parentIndex: i,
            parentOid: tmpOid,
            rootOid: tmpRootOid,
            parentKey: levelKey,
            isAddChildLevel: true,
            uniqueKey: tmpUniqueKey,
            parentUniqueKey: tmpUniqueKey,
          } )
        ]
      }
    }

    let tmpUniqueKey = `${ [ config[ levelKey ].id ] }-${ levelArr.length }`

    tmpUniqueKey = parentUniqueKey ? `${ parentUniqueKey }__${ tmpUniqueKey }` : tmpUniqueKey

    data[ levelKey ] = [
      ...( data[ levelKey ] || [] ),
      getLevelWiseObject( {
        parentKey,
        parentOid,
        name: 'ADD',
        isAdd: true,
        parentUniqueKey,
        parentIndex,
        uniqueKey: tmpUniqueKey,
        currentIndex: levelArr.length,
        rootOid: isRootLevel ? tmpUniqueKey : rootOid,
      } )
    ]
  }

  outerRecursive( levelKey, arr )

  return data
}

// 1. Don't mess with below function
// below method is being used by components who consume this ( HierachyForm ) generic component
export const reArrangeFormState = ( config, rootLevelKey, formState = {}, isReArrangeAPIResponse = false ) => {
  if ( isEmpty( config ) )
    throw new Error( 'Failed to load config object' )

  const result = {}

  if ( rootLevelKey && !isEmpty( formState ) ) {
    const rootLevelState = formState[ rootLevelKey ]

    const recursive = ( levelKey, levelArr = [], intermediateTmp = {} ) => {
      if ( !levelKey || !levelArr.length )
        return

      const { childKey, dataKeys: currentDataKeys } = config[ levelKey ] || {}

      const { oid: currentOidKey, apiKey: currentAPIKey, childAPIKey } = currentDataKeys || {}

      if ( !currentOidKey || !currentAPIKey )
        return

      for ( let i = 0; i < levelArr.length; i++ ) {
        const { oid, name, uniqueKey, isAdd = false, isValueUnknown = false } = levelArr[ i ]

        if ( isAdd || isValueUnknown )
          continue

        const tmp = {}

        if ( isReArrangeAPIResponse )
          tmp[ 'name' ] = name

        tmp[ currentOidKey ] = oid

        if ( childAPIKey )
          tmp[ childAPIKey ] = []

        intermediateTmp[ currentAPIKey ] = [
          ...( intermediateTmp[ currentAPIKey ] || [] ),
          tmp,
        ]

        // any one child based variable will work no need of both childKey and childAPIKey but just to strict check on schema
        if ( childKey && childAPIKey ) {
          const childLevelState = formState[ childKey ]

          const filteredLevelArr = childLevelState.filter( elem => uniqueKey === elem.parentUniqueKey && !( elem.isAdd || elem.isValueUnknown ) )

          if ( filteredLevelArr.length )
            recursive( childKey, filteredLevelArr, tmp )
        }
      }
    }

    recursive( rootLevelKey, rootLevelState, result )
  }

  // converted 2D array to 1D and then returned
  return [].concat( ...Object.values( result ) )
}

// NOTE:
// 1. Do not alter below function
// 2. Below function is written to fix issue with the API response not being sent in proper format. If in future API response format issue is fixed then no need of below function
export const reArrangeAPIResponse = ( config, rootLevelKey, data = [] ) => {
  if ( isEmpty( config ) )
    throw new Error( 'Failed to load config object' )

  if ( !data.length )
    return []

  const result = {}

  const recursive = ( levelKey, levelData, parentUniqueKey = null ) => {
    const { childKey, dataKeys, isRootLevel } = config[ levelKey ] || {}
    const { oid: oidKey, name: nameKey, childAPIKey } = dataKeys || {}

    const levelGroupedData = groupBy( levelData, oidKey )

    if ( oidKey && nameKey ) {
      for ( const key in levelGroupedData ) {
        const tmpArr = levelGroupedData[ key ]

        for ( let i = 0; i < tmpArr.length; i++ ) {
          const { [ childAPIKey ]: childArr, [ oidKey ]: oid, [ nameKey ]: name } = tmpArr[ i ]

          const tmpParentUniqueKey = isRootLevel ? oid : parentUniqueKey

          const tmpObject = {
            [ key ]: {
              oid,
              name,
              uniqueKey: oid,
            }
          }

          if ( !isRootLevel )
            tmpObject[ key ][ 'parentUniqueKey' ] = tmpParentUniqueKey

          result[ levelKey ] = {
            ...( result[ levelKey ] || {} ),
            ...tmpObject,
          }

          if ( childAPIKey )
            recursive( childKey, childArr, oid )
        }
      }
    }
  }

  recursive( rootLevelKey, data )

  // conversion of 2D array to 1D
  for ( const key in result )
    result[ key ] = [].concat( ...Object.values( result[ key ] ) )

  if ( !isEmpty( result ) )
    return reArrangeFormState( config, rootLevelKey, result, true )

  return []
}
