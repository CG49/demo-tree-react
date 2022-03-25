import React, { useEffect, useState } from 'react'

// components
import { Blob, CONFIG, ROOT_LEVEL_KEY } from './Blob'
import { ProductPlans } from './ProductPlans'

// utils
import { reArrangeFormState } from '../HierarchyForm/utils'

// css
import './Link.scss'

export const Link = () => {
	const [ state, setState ] = useState( [] )

	useEffect( () => {
		console.log('-=-=')
		console.log(reArrangeFormState( state, CONFIG, ROOT_LEVEL_KEY ))
	  }, [ state ] )

	  return (
		<>
			<Blob setParentState={ setState } />
			<hr />
			<ProductPlans setParentState={ setState } />
		</>
	)
}
