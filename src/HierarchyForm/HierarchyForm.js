import React, { useEffect, useReducer, createRef } from 'react'

// External Libraries
import { isEmpty } from 'lodash'

import { Level } from './Level'
import { Ladder } from './Ladder'
import { reducer } from './utils/reducer'

import './scss/HierarchyForm.scss'

export const HierarchyForm = React.memo( ( {
	config,
	globalStore,
	rootLevelKey,
	title = null,
	setParentState,
	formInitState = {},
} ) => {
	const [ reducerState, dispatch ] = useReducer( reducer, null, () => formInitState )

	const refs = {}
	const childElements = {}
	const parentElements = {}

	useEffect( () => {
		const data = reducerState?.[ rootLevelKey ] || []

		if ( data.length ) {
			let isUpdateParentState = false

			for ( let i = 0; i < data.length; i++ ) {
				const { isAdd, isValueUnknown, isReIndexed = false } = data[ i ]

				if ( isUpdateParentState )
					break

				if ( !isReIndexed )
					continue

				if ( !isReIndexed && ( isAdd || isValueUnknown ) )
					continue

				isUpdateParentState = true
			}

			if ( isUpdateParentState )
				setParentState( reducerState )
		}
		// eslint-disable-next-line
	}, [ reducerState ] )

	const handleOnChange = React.useCallback( ( actionType, payload ) => {
		dispatch( {
			config,
			payload,
			rootLevelKey,
			type: actionType,
		} )
		// eslint-disable-next-line
	}, [] )

	const handleOnClick = React.useCallback( ( actionType, payload ) => {
		dispatch( {
			config,
			payload,
			rootLevelKey,
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
						defaultValue,
						handleOnClick,
						handleOnChange,
						globalLevelData,
						placeholder: label,
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
			{ title && <span className='title'>{ title }</span> }

			{ !isEmpty( parentElements ) &&
				<Ladder
					childElements={ childElements }
					parentElements={ parentElements }
				/>
			}
		</div>
	)
} )
