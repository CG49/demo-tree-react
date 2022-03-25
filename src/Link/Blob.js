import React, { useEffect, useState } from 'react'

// External Libraries
import axios from 'axios'

// components and utils
import { HierarchyForm, prepareFormState, prepareGlobalStoreData } from '../HierarchyForm'

export const CONFIG = {
	BLOB: {
		id: 'BLOB',
		parentKey: null,
		buttonText: 'BLOB',
		label: 'Block of Business',
		isRootLevel: true,
		childKey: 'CLIENTS',
		globalStateKey: 'blob',
		globalDataKeys: {
			oid: 'oid',
			rootOid: 'oid',
			parentOid: null,
			value: 'BlkOfBusId',
			label: 'BlkOfBusName',
		},
		dataKeys: {
			apiKey: 'BlockOfBusiness',
			oid: 'BlockOfBusinessOid',
			id: 'BlockOfBusinessID',
			name: 'BlockOfBusinessName',
			childAPIKey: 'Client',
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
		},
	},
	CLIENTS: {
		id: 'CLIENTS',
		parentKey: 'BLOB',
		buttonText: 'EMPLOYER',
		label: 'Employer',
		isRootLevel: false,
		childKey: 'LOCATIONS',
		globalStateKey: 'clients',
		globalDataKeys: {
			oid: 'oid',
			value: 'ClientId',
			label: 'ClientName',
			rootOid: 'BlkOfBusOid',
			parentOid: 'BlkOfBusOid',
		},
		dataKeys: {
			oid: 'ClientOid',
			name: 'ClientName',
			apiKey: 'Client',
			childAPIKey: 'Location',
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
		},
	},
	LOCATIONS: {
		id: 'LOCATIONS',
		parentKey: 'CLIENTS',
		buttonText: 'LOCATION',
		label: 'Location',
		isRootLevel: false,
		childKey: null,
		globalStateKey: 'locations',
		globalDataKeys: {
			oid: 'oid',
			value: 'oid',
			label: 'LocationName',
			parentOid: 'ClientOid',
			rootOid: 'BlkOfBusOid',
		},
		dataKeys: {
			oid: 'LocationOid',
			name: 'LocationName',
			childAPIKey: null,
			apiKey: 'Location',
		},
		styles: {
			addButton: {
				width: '480px',
				height: '38px',
				marginLeft: '95px',
			},
			selectField: {
				width: '480px',
				marginLeft: '95px',
			},
		},
	},
}

const TITLE = 'Block of Businesses'
export const ROOT_LEVEL_KEY = CONFIG.BLOB.id

// either redux or fetch
const endpoints = {
	[ CONFIG.BLOB.id ]: 'http://localhost:8080/blob',
	[ CONFIG.CLIENTS.id ]: 'http://localhost:8081/clients',
	[ CONFIG.LOCATIONS.id ]: 'http://localhost:8082/locations',
}

const initGlobalData = {
	[ CONFIG.BLOB.id ]: [],
	[ CONFIG.CLIENTS.id ]: [],
	[ CONFIG.LOCATIONS.id ]: [],
}

export const Blob = React.memo( ( { setParentState = null } ) => {
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
