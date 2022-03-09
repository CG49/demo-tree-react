import React, {
	createRef,
	useRef, useReducer,
} from 'react'

// External Libraries
import {
	Form,
	Button
} from 'react-bootstrap'
import { components } from 'react-select'
import AsyncSelect from 'react-select/async'
import { isArray, isEmpty } from 'lodash'

// utils
import { getLevelWiseObject } from './common'

// css
import './Level.scss'

const refs = {}

const reducer = ( state, { type, payload } ) => {
	const { oid, key, rootOid, childKey, parentOid, parentUniqueKey, uniqueKey, isRootLevel } = payload

	if ( !isArray( state ) )
		return state

	let object = {}

	switch ( type ) {
		case 'REMOVE':
			if ( !oid || !key || !uniqueKey )
				return state

			let tmpArr = []
			const removeUniqueKeys = uniqueKey.split( '__' )

			for ( let i = 0; i < removeUniqueKeys.length; i++ ) {
				const [ levelKey, levelIndex ] = removeUniqueKeys[ i ].split( '-' )

				tmpArr = isRootLevel ? state : object[ levelKey ]

				object = ( isEmpty( object ) || isRootLevel )
					? state[ levelIndex ][ levelKey ]
					: object[ levelKey ][ levelIndex ]

				if ( levelKey === key ) {
					// re-arrange keys for each object in array
					if ( isArray( tmpArr ) ) {
						const arr = []
						const parsedLevelIndex = parseInt( levelIndex )
						for ( let j = 0; j < tmpArr.length; j++ ) {
							const value = isRootLevel ? tmpArr[ j ][ levelKey ] : tmpArr[ j ]
							const { oid: tmpOid } = value

							// skip adding of current iteration oid and field with isAdd set to true
							if ( oid === tmpOid )
								continue
							arr.push( value )
						}
						// tmpArr = [ ...arr ]
						// console.log( arr, arr.length )
						// console.log( JSON.parse( JSON.stringify( tmpArr ) ), parsedLevelIndex )
						tmpArr.splice( parsedLevelIndex, 1 )
						// console.log( tmpArr.length, tmpArr )
						// let arr = tmpArr

						for ( let j = parsedLevelIndex; j < tmpArr.length; j++ ) {
							const tmpObject = isRootLevel ? tmpArr[ j ][ levelKey ] : tmpArr[ j ]
							// console.log( j, tmpObject )
							let tmpUniqueKey = `${ levelKey }-${ j }`
							const { oid, uniqueKey, parentUniqueKey } = tmpObject

							if ( !isRootLevel )
								tmpUniqueKey = `${ parentUniqueKey }__${ tmpUniqueKey }`

							if ( oid === uniqueKey )
								tmpObject.oid = tmpUniqueKey

							tmpObject.currentIndex = j
							tmpObject.uniqueKey = tmpUniqueKey
						}
						// console.log( tmpArr.length, JSON.parse( JSON.stringify( tmpArr ) ), levelIndex )
					}
				}
				// console.log( JSON.parse( JSON.stringify( state ) ), '[]state' )
			}

			return JSON.parse( JSON.stringify( state ) )

		case 'ADD':
			if ( !oid || !key || !uniqueKey )
				return state

			const addUniqueKeys = uniqueKey.split( '__' )

			for ( let i = 0; i < addUniqueKeys.length; i++ ) {
				let tmpArr = []
				const [ levelKey, levelIndex ] = addUniqueKeys[ i ].split( '-' )

				tmpArr = isRootLevel ? state : object[ levelKey ]

				object = ( isEmpty( object ) || isRootLevel )
					? state[ levelIndex ][ levelKey ]
					: object[ levelKey ][ levelIndex ]

				if ( levelKey === key ) {
					object.isAdd = false

					if ( isArray( tmpArr ) ) {
						const newIndex = parseInt( levelIndex ) + 1
						const tmpUniqueKey = `${ levelKey }-${ newIndex }`

						const tmpLevelObject = getLevelWiseObject( {
							rootOid,
							parentOid,
							isAdd: true,
							parentUniqueKey,
							currentIndex: newIndex,
							uniqueKey: isRootLevel ? tmpUniqueKey : `${ parentUniqueKey }__${ tmpUniqueKey }`,
						} )

						tmpArr[ newIndex ] = isRootLevel ? { [ levelKey ]: tmpLevelObject } : tmpLevelObject
					}
					// console.log( tmpArr, '[][][][][]', levelIndex )
					if ( childKey ) {
						object[ childKey ] = [ getLevelWiseObject( {
							childKey,
							parentOid,
							isAdd: true,
							uniqueKey,
							parentUniqueKey: uniqueKey,
							rootOid: isRootLevel ? uniqueKey : rootOid,
							// rootOid: uniqueKey,
						} ) ]
						// console.log( 'ABCD', object )
					}
				}
			}

			return JSON.parse( JSON.stringify( state ) )

		default:
			return state
	}
}
const getInit = ( formInitState ) => {
	console.log( 'getttttttttttttt===========================================' )
	return formInitState
}

export const HierarchyForm = ( {
	title,
	options,
	globalStore,
	handleOnChange,
	formInitState = [],
} ) => {
	const [ reducerState, dispatch ] = useReducer( reducer, null, () => getInit( formInitState ) )
	console.log( reducerState, '==' )
	const elem = []

	const onChangeHandler = React.useCallback( value => {
		// Do Something..
		handleOnChange( value )
		// eslint-disable-next-line
	}, [] )

	const handleOnClick = React.useCallback( ( actionType, payload ) => {
		dispatch( {
			payload,
			type: actionType,
			configOptions: options,
		} )

		// eslint-disable-next-line
	}, [] )

	const getElementRecursive = level => {
		const key = Object.keys( level )[ 0 ]

		if ( !key ) {
			console.log( 'okay' )
			return
		}

		const {
			stateKey, childKey,
			isRootLevel = false, label = '', buttonText = '',
			styles = {
				width: '550px',
				marginLeft: '25px',
			},
		} = options[ key ]

		const {
			oid,
			uniqueKey,
			isAdd = false,
			rootOid = null,
			parentOid = null,
			parentUniqueKey = null,
		} = level[ key ] || {}
		let globalData = globalStore[ stateKey ] || []
		const childrens = level[ key ][ childKey ] || []

		// filter sub-level options based on root level
		if ( !isRootLevel ) {
			// const tmpOidKey = ( uniqueKey === oid ) ? 'rootOid' : 'parentOid'
			// const tmpOidValue = ( uniqueKey === oid ) ? rootOid : parentOid

			if ( rootOid !== parentUniqueKey )
				globalData = rootOid ? globalData.filter( value => rootOid === value[ 'rootOid' ] ) : []
			else
				console.log( level[ key ] )
			// if ( key === 'CLIENTS' )
			// 	console.log( globalData, key, isAdd )
		}

		if ( !globalData.length || !oid ) {
			// if ( key === 'CLIENTS' )
			console.log( 'fisrt' )
			return
		}
		let tmpArr = [],
			tmpObject = {}
		const tmpOids = []
		const uniqueKeys = uniqueKey.split( '__' )

		// remove already selected values from dropdown
		for ( let i = 0; i < uniqueKeys.length; i++ ) {
			const [ levelKey, levelIndex ] = uniqueKeys[ i ].split( '-' )

			tmpArr = isRootLevel ? reducerState : tmpObject[ levelKey ]

			if ( key === 'PRODUCTS' && levelIndex === '0' ) {
				console.log( reducerState[ levelIndex ] )
			}

			tmpObject = ( isEmpty( tmpObject ) || isRootLevel )
				? reducerState[ levelIndex ][ levelKey ]
				: tmpObject[ levelKey ][ levelIndex ]

			if ( levelKey === key && isArray( tmpArr ) ) {
				for ( let j = 0; j < tmpArr.length; j++ ) {
					const { oid: tmpOid, isAdd = false } = isRootLevel ? tmpArr[ j ][ levelKey ] : tmpArr[ j ]

					// skip adding of current iteration oid and field with isAdd set to true
					if ( isAdd || oid === tmpOid )
						continue
					tmpOids.push( tmpOid )
				}
			}
		}

		globalData = globalData.filter( value => !tmpOids.includes( value.oid ) )

		if ( !globalData.length ) {
			// if ( key === 'CLIENTS' )
			// console.log( oid, isAdd )
			return
		}
		if ( isAdd ) {
			// console.log( key, uniqueKey )
		}
		const defaultValue = ( isAdd || !oid ) ? null : globalData.find( elem => oid === elem.oid )

		refs[ uniqueKey ] = createRef()

		elem.push( (
			<One
				key={ uniqueKey }
				ref={ refs[ uniqueKey ] }
				isRootLevel={ isRootLevel }
				options={ {
					key,
					globalData,
					isAdd,
					styles,
					childKey,
					rootOid,
					parentOid,
					parentUniqueKey,
					uniqueKey,
					defaultValue,
					handleOnClick,
					onChangeHandler,
					placeholder: label,
					buttonText: isAdd ? label : buttonText,
				} }
			/>
		) )

		for ( let i = 0; i < childrens.length; i++ )
			getElementRecursive( { [ childKey ]: childrens[ i ] } )
	}

	for ( let i = 0; i < reducerState.length; i++ ) {
		const level = reducerState[ i ]

		getElementRecursive( level )
	}

	// console.log( refs )
	return (
		<div className='main'>
			{/* Title */ }
			<span className='title'>{ title }</span>

			{ elem.length ? elem : 'opopo' }
		</div>
	)
}

const SearchIcon = props => {
	const image = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 30" width="20px" height="20px" aria-hidden="true" focusable="false"><path d="M 13 3 C 7.4889971 3 3 7.4889971 3 13 C 3 18.511003 7.4889971 23 13 23 C 15.396508 23 17.597385 22.148986 19.322266 20.736328 L 25.292969 26.707031 A 1.0001 1.0001 0 1 0 26.707031 25.292969 L 20.736328 19.322266 C 22.148986 17.597385 23 15.396508 23 13 C 23 7.4889971 18.511003 3 13 3 z M 13 5 C 17.430123 5 21 8.5698774 21 13 C 21 17.430123 17.430123 21 13 21 C 8.5698774 21 5 17.430123 5 13 C 5 8.5698774 8.5698774 5 13 5 z"/></svg>'

	return (
		<components.DropdownIndicator { ...props }>
			<img src={ `data:image/svg+xml;utf8,${ encodeURIComponent( image ) }` } alt="" />
		</components.DropdownIndicator>
	)
}

const One = React.forwardRef( ( { isRootLevel = false, options }, ref ) => {
	const {
		key,
		isAdd,
		styles,
		rootOid,
		childKey,
		parentOid,
		globalData = [],
		uniqueKey,
		handleOnClick,
		parentUniqueKey,
		onChangeHandler,
		buttonText = '',
		placeholder = '',
		defaultValue = null,
	} = options || {}
	// console.log( options )
	const collapsibleRef = useRef()

	const filterOptions = inputValue => globalData.filter( i => i.label.toLowerCase().includes( inputValue.toLowerCase() ) )

	const promiseOptions = inputValue =>
		new Promise( resolve => {
			setTimeout( () => {
				resolve( filterOptions( inputValue ) )
			}, 1000 )
		} )

	const onClickHandler = actionType => {
		const { oid = uniqueKey } = defaultValue || {}

		handleOnClick( actionType, { oid, key, isAdd, rootOid, childKey, parentOid, parentUniqueKey, uniqueKey, isRootLevel } )
	}

	return (
		<Form.Group className='tree'>
			<div className={ `icon-container ${ ( !isRootLevel || isAdd ) && 'hidden' }` } ref={ collapsibleRef }>
				<span className='icon caret-down'></span>
			</div>

			{ isAdd ?
				<Button
					bsPrefix="add-button"
					style={ ( styles.button || {} ) }
					onClick={ () => onClickHandler( 'ADD' ) }
				>
					<span>+ Add { buttonText }</span>
				</Button>
				: (
					<>
						<AsyncSelect
							ref={ ref }
							cacheOptions
							isClearable={ true }
							defaultOptions={ globalData }
							onChange={ onChangeHandler }
							defaultValue={ defaultValue }
							loadOptions={ promiseOptions }
							placeholder={ `Select ${ placeholder }` }
							components={ { DropdownIndicator: SearchIcon } }
							styles={ {
								container: provided => ( {
									...provided,
									...( styles.selectField || {} ),
								} ),
								indicatorSeparator: () => null
							} }
						/>
						<Button
							bsPrefix="remove-button"
							onClick={ () => onClickHandler( 'REMOVE' ) }
						>
							<span>Remove { buttonText }</span>
						</Button>
					</>
				)
			}
		</Form.Group>
	)
} )
