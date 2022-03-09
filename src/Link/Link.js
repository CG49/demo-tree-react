import React from 'react'

// components
import { Blob } from './Blob'
import { ProductPlans } from './ProductPlans'

// css
import './Link.scss'

export const Link = () => {
	return (
		<>
			<Blob />
			<hr />
			<ProductPlans />
		</>
	)
}
