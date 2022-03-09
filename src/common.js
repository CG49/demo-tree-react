import { isEmpty } from 'lodash'

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

export const prepareGlobalStoreData = ( globalStore, config ) => {
	const data = {}

	if ( isEmpty( globalStore ) || isEmpty( config ) )
		return data

	// i refers to id in config e.g.: PRODUCTS, PLANS, BLOB, CLIENTS, LOCATIONS, etc.
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

export const prepareFormState = ( config, levelKey, arr = [] ) => {
	const data = {}

	if ( !levelKey || isEmpty( config ) )
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
				// logic to add children oids from main object to parent object as an array
				const innerRecursive = ( childKey, childrens ) => {
					const {
						dataKeys,
						// childKey: nestedChildKey = null,
					} = config[ childKey ] || {}
					const {
						oid,
						// childAPIKey,
					} = dataKeys || {}

					// if ( nestedChildKey )
					// 	object[ nestedChildKey ] = []

					for ( let j = 0; j < childrens.length; j++ ) {
						// let tmpChildrens = []
						const tmpOid = childrens[ j ][ oid ]

						if ( !tmpOid )
							continue

						// if ( childAPIKey )
						// 	tmpChildrens = ( childrens[ j ][ childAPIKey ] || [] )

						object[ childKey ] = [
							...( object[ childKey ] || [] ),
							tmpOid,
						]

						// logic to add nested children oids from main object to root parent object as an array
						// if ( tmpChildrens.length )
						// 	innerRecursive( nestedChildKey, tmpChildrens )
					}
				}

				innerRecursive( childKey, childrens )

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

/**

const prepareInitFormState = ( arr = [] ) => {
	const linkData = []

	for ( let i = 0; i < arr.length; i++ ) {
		const { BlockOfBusinessOid, Client = [] } = arr[ i ]

		if ( !BlockOfBusinessOid )
			continue

		let blobObject = getLevelWiseObject( {
			currentIndex: i,
			oid: BlockOfBusinessOid,
			[ CONFIG.CLIENTS.id ]: [],
			uniqueKey: `${ [ CONFIG.BLOB.id ] }-${ i }`,
		} )

		for ( let j = 0; j < Client.length; j++ ) {
			const clientIndex = j
			const { ClientOid, ClientName, Location = [] } = Client[ j ]

			if ( !ClientOid )
				continue

			let clientObject = getLevelWiseObject( {
				oid: ClientOid,
				name: ClientName,
				currentIndex: clientIndex,
				rootOid: BlockOfBusinessOid,
				[ CONFIG.LOCATIONS.id ]: [],
				parentOid: BlockOfBusinessOid,
				parentUniqueKey: blobObject[ 'uniqueKey' ],
				uniqueKey: `${ blobObject[ 'uniqueKey' ] }__${ [ CONFIG.CLIENTS.id ] }-${ clientIndex }`,
			} )

			for ( let k = 0; k < Location.length; k++ ) {
				const locationIndex = k
				const { LocationOid, LocationName } = Location[ k ]

				if ( !LocationOid )
					continue

				clientObject = {
					...( clientObject || {} ),
					[ CONFIG.LOCATIONS.id ]: [
						...( clientObject[ CONFIG.LOCATIONS.id ] || [] ),
						getLevelWiseObject( {
							oid: LocationOid,
							name: LocationName,
							parentOid: ClientOid,
							rootOid: BlockOfBusinessOid,
							currentIndex: locationIndex,
							parentUniqueKey: clientObject[ 'uniqueKey' ],
							uniqueKey: `${ clientObject[ 'uniqueKey' ] }__${ [ CONFIG.LOCATIONS.id ] }-${ locationIndex }`,
						} ),
					],
				}
			}

			// append add location object
			clientObject = {
				...clientObject,
				[ CONFIG.LOCATIONS.id ]: [
					...( clientObject[ CONFIG.LOCATIONS.id ] || [] ),
					getLevelWiseObject( {
						isAdd: true,
						parentOid: ClientOid,
						rootOid: BlockOfBusinessOid,
						currentIndex: Location.length,
						parentUniqueKey: clientObject[ 'uniqueKey' ],
						uniqueKey: `${ clientObject[ 'uniqueKey' ] }__${ [ CONFIG.LOCATIONS.id ] }-${ Location.length }`,
					} ),
				]
			}

			blobObject = {
				...blobObject,
				[ CONFIG.CLIENTS.id ]: [
					...( blobObject[ CONFIG.CLIENTS.id ] || [] ),
					clientObject,
				]
			}
		}

		// append add client object
		blobObject = {
			...blobObject,
			[ CONFIG.CLIENTS.id ]: [
				...( blobObject[ CONFIG.CLIENTS.id ] || [] ),
				getLevelWiseObject( {
					isAdd: true,
					currentIndex: Client.length,
					[ CONFIG.LOCATIONS.id ]: [],
					rootOid: BlockOfBusinessOid,
					parentOid: BlockOfBusinessOid,
					parentUniqueKey: blobObject[ 'uniqueKey' ],
					uniqueKey: `${ blobObject[ 'uniqueKey' ] }__${ [ CONFIG.CLIENTS.id ] }-${ Client.length }`,
				} ),
			]
		}

		linkData.push( {
			[ CONFIG.BLOB.id ]: blobObject,
		} )
	}

	// append add blob object
	linkData.push( {
		[ CONFIG.BLOB.id ]: getLevelWiseObject( {
			isAdd: true,
			currentIndex: arr.length,
			[ CONFIG.CLIENTS.id ]: [],
			uniqueKey: `${ [ CONFIG.BLOB.id ] }-${ arr.length }`,
		} )
	} )

	return linkData
}



const prepareInitFormState = ( { Product = [] } ) => {
	const linkData = []
	const arr = Product || []

	for ( let i = 0; i < arr.length; i++ ) {
		const { ProductOid, Plan = [] } = arr[ i ]

		if ( !ProductOid )
			continue

		let productObject = getLevelWiseObject( {
			currentIndex: i,
			oid: ProductOid,
			[ CONFIG.PLANS.id ]: [],
			uniqueKey: `${ [ CONFIG.PRODUCTS.id ] }-${ i }`,
		} )

		for ( let j = 0; j < Plan.length; j++ ) {
			const planIndex = j
			const { PlanOid } = Plan[ j ]

			if ( !PlanOid )
				return

			let planObject = getLevelWiseObject( {
				oid: PlanOid,
				rootOid: ProductOid,
				parentOid: ProductOid,
				currentIndex: planIndex,
				parentUniqueKey: productObject[ 'uniqueKey' ],
				uniqueKey: `${ productObject[ 'uniqueKey' ] }__${ [ CONFIG.PLANS.id ] }-${ planIndex }`,
			} )

			productObject = {
				...productObject,
				[ CONFIG.PLANS.id ]: [
					...( productObject[ CONFIG.PLANS.id ] || [] ),
					planObject,
				],
			}
		}

		// append add plan object
		productObject = {
			...productObject,
			[ CONFIG.PLANS.id ]: [
				...( productObject[ CONFIG.PLANS.id ] || [] ),
				getLevelWiseObject( {
					isAdd: true,
					rootOid: ProductOid,
					parentOid: ProductOid,
					currentIndex: Plan.length,
					parentUniqueKey: productObject[ 'uniqueKey' ],
					uniqueKey: `${ productObject[ 'uniqueKey' ] }__${ [ CONFIG.PLANS.id ] }-${ Plan.length }`,
				} ),
			],
		}

		linkData.push( {
			[ CONFIG.PRODUCTS.id ]: productObject,
		} )
	}

	// append add product object
	linkData.push( {
		[ CONFIG.PRODUCTS.id ]: getLevelWiseObject( {
			isAdd: true,
			currentIndex: arr.length,
			uniqueKey: `${ [ CONFIG.PRODUCTS.id ] }-${ arr.length }`,
			[ CONFIG.PLANS.id ]: [],
		} )
	} )

	return linkData
}
 */