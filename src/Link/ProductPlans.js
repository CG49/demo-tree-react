import React, { useEffect, useState } from 'react'

// External Libraries
import axios from 'axios'

// components and utils
import { HierarchyForm, prepareFormState, prepareGlobalStoreData } from '../HierarchyForm'


const CONFIG = {
	PRODUCTS: {
		id: 'PRODUCTS',
		parentKey: null,
		buttonText: 'PRODUCT',
		label: 'Product',
		isRootLevel: true,
		childKey: 'PLANS',
		globalStateKey: 'products',
		globalDataKeys: {
			oid: 'oid',
			rootOid: null,
			parentOid: null,
			value: 'ProductId',
			label: 'ProductName',
		},
		dataKeys: {
			apiKey: 'Product',
			oid: 'ProductOid',
			name: 'ProductName',
			childAPIKey: 'Plan',
		},
		styles: {
			addButton: {
				width: '550px',
				height: '38px',
				marginLeft: '25px',
			},
			selectField: {
				width: '550px',
				marginLeft: '25px',
			},
		}
	},
	PLANS: {
		id: 'PLANS',
		parentKey: 'PRODUCTS',
		buttonText: 'PLAN',
		label: 'Plan',
		isRootLevel: false,
		childKey: null,
		globalStateKey: 'plans',
		globalDataKeys: {
			oid: 'oid',
			value: 'oid',
			label: 'PlanName',
			rootOid: 'ProductOid',
			parentOid: 'ProductOid',
		},
		dataKeys: {
			apiKey: 'Plan',
			oid: 'PlanOid',
			name: 'PlanName',
			childAPIKey: null,
		},
		styles: {
			addButton: {
				width: '515px',
				height: '38px',
				marginLeft: '60px',
			},
			selectField: {
				width: '515px',
				marginLeft: '60px',
			},
		}
	},
}

const TITLE = 'Products and Plans'
const ROOT_LEVEL_KEY = CONFIG.PRODUCTS.id

// either redux or fetch
const endpoints = {
	[ CONFIG.PRODUCTS.id ]: 'http://localhost:8084/products',
	[ CONFIG.PLANS.id ]: 'http://localhost:8085/plans',
}

const initGlobalData = {
	[ CONFIG.PRODUCTS.globalStateKey ]: [],
	[ CONFIG.PLANS.globalStateKey ]: [],
}

export const ProductPlans = React.memo( ( { setParentState } ) => {
	const [ linkState, setLinkState ] = useState( {} )
	const [ isLoading, setIsLoading ] = useState( true )
	const [ globalState, setGlobalState ] = useState( initGlobalData )

	useEffect( () => {
		( async () => {
			try {
				const { data } = await axios.get( 'http://localhost:8083/link' )

				let globalStoreData = await Promise.all( Object.keys( endpoints ).map( async key => {
					const endpoint = endpoints[ key ]

					try {
						const { data } = await axios.get( endpoint )

						return Promise.resolve( { [ key ]: data } )
					} catch ( error ) {
						return Promise.reject( error )
					}
				} ) )

				globalStoreData = Object.assign( {}, ...globalStoreData )

				setGlobalState( prevState => ( {
					...prevState,
					...prepareGlobalStoreData( globalStoreData, CONFIG ),
				} ) )

				const arr = data[ CONFIG[ ROOT_LEVEL_KEY ][ 'dataKeys' ][ 'apiKey' ] ] || []

				setLinkState( prepareFormState( CONFIG, ROOT_LEVEL_KEY, arr ) )

				setIsLoading( false )
			} catch ( error ) {
				console.error( error )
				setIsLoading( false )
			}
		} )()
	}, [] )

	return (
		!isLoading &&
		<HierarchyForm
			title={ TITLE }
			config={ CONFIG }
			formInitState={ linkState }
			globalStore={ globalState }
			rootLevelKey={ ROOT_LEVEL_KEY }
			setParentState={ setParentState }
		/>
	)
} )
