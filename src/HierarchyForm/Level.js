import React, { useRef } from 'react'

// External Libraries
import { components } from 'react-select'
import AsyncSelect from 'react-select/async'
import { Form, Button } from 'react-bootstrap'
import { DashCircleFill, Search } from 'react-bootstrap-icons'

// css
import './scss/Level.scss'
console.log( DashCircleFill )
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

const CustomSearchIcon = props => (
  <components.DropdownIndicator { ...props }>
    <Search color='black' />
  </components.DropdownIndicator>
)

// NOTE: Refs are not being used; refs were added for the purpose of validation
// TODO: We can remove refs if validation of fields not necessary
export const Level = React.forwardRef( ( { options, handleCollapsible, isExpanded, isRootLevel = false }, ref ) => {
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
        <span className={ `caret caret-${ isExpanded ? 'up' : 'down' }` }></span>
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
                components={ { DropdownIndicator: CustomSearchIcon } }
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
              <DashCircleFill size={ 15 } />
              <span>Remove { buttonText }</span>
            </Button>
          </>
        )
      }
    </Form.Group>
  )
} )
