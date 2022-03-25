import React, { useRef } from 'react'

// External Libraries
import { Form, Button } from 'react-bootstrap'
import { components } from 'react-select'
import AsyncSelect from 'react-select/async'

// css
import './scss/Level.scss'

const defaultStyle = {
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

const SearchIcon = props => {
  const image = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 30" width="20px" height="20px" aria-hidden="true" focusable="false"><path d="M 13 3 C 7.4889971 3 3 7.4889971 3 13 C 3 18.511003 7.4889971 23 13 23 C 15.396508 23 17.597385 22.148986 19.322266 20.736328 L 25.292969 26.707031 A 1.0001 1.0001 0 1 0 26.707031 25.292969 L 20.736328 19.322266 C 22.148986 17.597385 23 15.396508 23 13 C 23 7.4889971 18.511003 3 13 3 z M 13 5 C 17.430123 5 21 8.5698774 21 13 C 21 17.430123 17.430123 21 13 21 C 8.5698774 21 5 17.430123 5 13 C 5 8.5698774 8.5698774 5 13 5 z"/></svg>'

  return (
    <components.DropdownIndicator { ...props }>
      <img src={ `data:image/svg+xml;utf8,${ encodeURIComponent( image ) }` } alt="" />
    </components.DropdownIndicator>
  )
}

// NOTE: Refs are not being used; refs were added for the purpose of validation
// TODO: We can remove refs if validation of fields not necessary
export const Level = React.forwardRef( ( { options, handleCollapsible, isRootLevel = false }, ref ) => {
  const {
    isAdd,
    rootOid,
    levelKey,
    childKey,
    parentKey,
    parentOid,
    uniqueKey,
    parentIndex,
    currentIndex,
    handleOnClick,
    handleOnChange,
    isValueUnknown,
    parentUniqueKey,
    buttonText = '',
    placeholder = '',
    defaultValue = null,
    globalLevelData = [],
    styles = defaultStyle,
  } = options || {}

  const collapsibleRef = useRef()

  const filterOptions = inputValue => globalLevelData.filter( i => i.label.toLowerCase().includes( inputValue.toLowerCase() ) )

  const promiseOptions = inputValue =>
    new Promise( resolve =>
      setTimeout( () => {
        resolve( filterOptions( inputValue ) )
      }, 1000 )
    )

  const onClickCollapsibleHandler = React.useCallback(
    () => isRootLevel && handleCollapsible( { rootOid } ),
    // eslint-disable-next-line
    [] )

  const onChangeHandler = React.useCallback( ( actionType, value ) => {
    const { oid, label, rootOid, parentOid } = value || {}

    const isValueCleared = !oid

    handleOnChange( actionType, { oid, isAdd, label, levelKey, parentKey, rootOid, childKey, parentOid, parentIndex, currentIndex, parentUniqueKey, uniqueKey, isRootLevel, isValueCleared, isValueUnknown } )

    // eslint-disable-next-line
  }, [] )

  const onClickHandler = React.useCallback( actionType => {
    const maxLength = globalLevelData.length

    const { oid = uniqueKey } = defaultValue || {}

    handleOnClick( actionType, { oid, isAdd, levelKey, parentKey, rootOid, childKey, parentOid, parentIndex, currentIndex, parentUniqueKey, uniqueKey, isRootLevel, maxLength, isValueUnknown } )

    // eslint-disable-next-line
  }, [] )

  return (
    <Form.Group className='level ml-n3'>
      <div
        ref={ collapsibleRef }
        onClick={ () => isRootLevel && onClickCollapsibleHandler() }
        className={ `icon-container${ ( !isRootLevel || isAdd ) ? ' icon-hidden' : '' }` }
      >
        <span className='icon caret-down'></span>
      </div>

      { isAdd ?
        <Button
          bsPrefix='add-button'
          style={ ( styles.addButton || {} ) }
          onClick={ () => onClickHandler( 'ADD' ) }
        >
          <span>+ Add { buttonText }</span>
        </Button>
        : (
          <>
            <span>
              <AsyncSelect
                ref={ ref }
                cacheOptions
                isClearable={ true }
                defaultValue={ defaultValue }
                loadOptions={ promiseOptions }
                defaultOptions={ globalLevelData }
                placeholder={ `Select ${ placeholder }` }
                components={ { DropdownIndicator: SearchIcon } }
                onChange={ value => onChangeHandler( 'CHANGE', value ) }
                styles={ {
                  container: provided => ( {
                    ...provided,
                    ...( styles.selectField || {} ),
                  } ),
                  indicatorSeparator: () => null
                } }
              />
            </span>

            <Button
              bsPrefix='remove-button'
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
