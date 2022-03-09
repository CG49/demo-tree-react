import React, { useEffect, useState } from 'react'

// External Libraries
import { Collapse } from 'react-bootstrap'
import { isEmpty } from 'lodash'

const getState = ( rootOids, prevState = {} ) => {
	const initState = {}

	for ( let i = 0; i < rootOids.length; i++ )
		initState[ rootOids[ i ] ] = typeof prevState[ rootOids[ i ] ] === 'undefined' ? true : prevState[ rootOids[ i ] ]

	return initState
}

export const Ladder = ( { parentElements = {}, childElements = {} } ) => {
	const elements = []
	const rootOids = Object.keys( parentElements )

	const [ state, setState ] = useState( () => getState( rootOids ) )

	useEffect( () => {
		setState( prevState => getState( rootOids, prevState ) )
		// eslint-disable-next-line
	}, [ parentElements, childElements ] )

	const handleCollapsible = React.useCallback( ( { rootOid } ) => {
		// Change the collapsible icon
		// ...

		setState( prevState => ( {
			...prevState,
			[ rootOid ]: !prevState[ rootOid ],
		} ) )
		// eslint-disable-next-line
	}, [] )

	for ( const rootOid in parentElements ) {
		elements.push(
			React.cloneElement( parentElements[ rootOid ][ 0 ], { handleCollapsible } )
		)

		if ( !isEmpty( childElements ) && !isEmpty( childElements[ rootOid ] ) ) {
			elements.push(
				<Collapse key={ rootOid } in={ state[ rootOid ] }>
					<div>
						{ childElements[ rootOid ] }
					</div>
				</Collapse>
			)
		}
	}

	return elements
}
