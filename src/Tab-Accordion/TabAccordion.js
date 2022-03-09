import { useEffect } from 'react'

import 'bootstrap/dist/css/bootstrap.min.css'
import Tabs from 'react-bootstrap/Tabs'
import Tab from 'react-bootstrap/Tab'
import TabContainer from 'react-bootstrap/TabContainer'
import TabContent from 'react-bootstrap/TabContent'
import TabPane from 'react-bootstrap/TabPane'
import Nav from 'react-bootstrap/Nav'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Container from 'react-bootstrap/Container'

import './Tab-Accordion.scss'

function TabAccordion () {
	useEffect( () => {
		( function () {
			// 'use strict'

			const toggleClass = function ( otherElems, thisELem, className = 'is-active' ) {
				for ( const otherElem of otherElems ) {
					otherElem.classList.remove( className )
				}

				thisELem.classList.add( className )
				// if ( thisELem.classList.contains( className ) )
				//   thisELem.classList.remove( className )
				// else
				//   thisELem.classList.add( className )
			}

			const toggleVerticalTabs = function ( tabContainer, tabs, items, item ) {
				item.onclick = function ( e ) {
					const currId = item.getAttribute( 'id' )
					const tab = tabContainer.querySelector( '.ootb-tabcordion--tabs [aria-controls="' + currId + '"]' )

					toggleClass( tabs, tab )
					toggleClass( items, item )
				}
			}

			const toggleTabs = function ( tabContainer ) {
				const tabs = tabContainer.querySelectorAll( '.ootb-tabcordion--tabs .tab' )
				const items = tabContainer.querySelectorAll( '.ootb-tabcordion--entry' )

				for ( const tab of tabs ) {
					tab.onclick = function () {
						const target = tab.getAttribute( 'aria-controls' )
						const content = document.getElementById( target )

						toggleClass( tabs, tab )
						toggleClass( items, content )
					}
				}

				for ( const item of items ) {
					toggleVerticalTabs( tabContainer, tabs, items, item )
				}
			}

			// const hasTabs = function ( container ) {
			//   return container.classList.contains( 'has-tabs' )
			// }

			const modeSwitcher = function ( tabContainer, containerWidth ) {
				const tabs = tabContainer.querySelectorAll( '.tab' )
				const container = tabs[ 0 ].closest( '.ootb-tabcordion' )
				let totalW = 0

				for ( const tab of tabs ) {
					totalW += tab.offsetWidth
				}
				// console.log( totalW, containerWidth )
				if ( totalW >= containerWidth ) {
					container.classList.remove( 'has-tabs' )
				} else {
					container.classList.add( 'has-tabs' )
				}

				// keyboardSupport( tabContainer, hasTabs( container ) )
			}

			const resizeObserver = new ResizeObserver( entries => {
				for ( let entry of entries ) {
					modeSwitcher( entry.target, entry.contentRect.width )
				}
			} )

			const tabContainers = document.querySelectorAll( '.ootb-tabcordion' )
			// console.log( tabContainers )
			for ( const tabContainer of tabContainers ) {
				const tabList = tabContainer.querySelector( '.ootb-tabcordion--tabs' )
				// console.log( tabList, tabContainer )
				resizeObserver.observe( tabList )
				toggleTabs( tabContainer )
				// keyboardSupport( tabContainer, hasTabs( tabContainer ) )
			}
		} )()
	}, [] )

	return (
		<div className="App">
			<article class="ootb-tabcordion">
				<div class="ootb-tabcordion--tabs" role="tablist" aria-label="TabCordion">
					<button class="tab is-active" role="tab" aria-selected="true" aria-controls="tab1-tab" id="tab1">Tab 1 with big text</button>
					<button class="tab" role="tab" aria-selected="false" aria-controls="tab2-tab" id="tab2" tabindex="-1">Tab 2 with big text</button>
					<button class="tab" role="tab" aria-selected="false" aria-controls="tab3-tab" id="tab3" tabindex="-1">Tab 3 with big text</button>
				</div>

				<section id="tab1-tab" class="ootb-tabcordion--entry is-active" data-title="Tab 1 with big text" tabindex="0" role="tabpanel" aria-labelledby="tab1">
					<div class="ootb-tabcordion--entry-container">
						<div class="ootb-tabcordion--entry-content">
							<p>A simple solution for having tabbed content on a large screen but turn it into accordion on a smaller
								one when the time is right. Just resize your screen to see the tabbed interface transforming into an
								accordion.</p>
							<p>In order to keep the HTML as clean as possible, without duplicating elements, we use element
								attributes as CSS content to display the accordion tabs. <a class="more" href="https://www.gsarigiannidis.gr/tabs-on-desktop-accordion-on-mobile/" target="_blank" rel="noreferrer">Read more</a></p>
						</div>
					</div>
				</section>

				<section id="tab2-tab" class="ootb-tabcordion--entry" data-title="Tab 2 with big text" tabindex="-1" role="tabpanel" aria-labelledby="tab2">
					<div class="ootb-tabcordion--entry-container">
						<div class="ootb-tabcordion--entry-content">
							<p>Tab 2 content. Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Donec odio. Quisque volutpat
								mattis eros. Nullam malesuada erat ut turpis. Suspendisse urna nibh, viverra non, semper suscipit,
								posuere a, pede. Nullam malesuada erat ut turpis. Suspendisse urna nibh, viverra non, semper suscipit,
								posuere a, pede.</p>
						</div>
					</div>
				</section>

				<section id="tab3-tab" class="ootb-tabcordion--entry" data-title="Tab 3 with big text" tabindex="-1" role="tabpanel" aria-labelledby="tab3">
					<div class="ootb-tabcordion--entry-container">
						<div class="ootb-tabcordion--entry-content">
							<p>Tab 3 content. Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Donec odio. Quisque volutpat
								mattis eros. Nullam malesuada erat ut turpis. Suspendisse urna nibh, viverra non, semper suscipit,
								posuere a, pede. Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Donec odio. Quisque volutpat
								mattis eros. Nullam malesuada erat ut turpis. Suspendisse urna nibh, viverra non, semper suscipit,
								posuere a, pede. Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Donec odio. Quisque volutpat
								mattis eros. Nullam malesuada erat ut turpis. Suspendisse urna nibh, viverra non, semper suscipit,
								posuere a, pede.</p>
						</div>
					</div>
				</section>
			</article>

			<Tab.Container id="left-tabs-example" defaultActiveKey="first">
				<Row>
					<Col sm={ 3 }>
						<Nav variant="pills" className="flex-column">
							<Nav.Item>
								<Nav.Link eventKey="first">Tab 1</Nav.Link>
							</Nav.Item>
							<Nav.Item>
								<Nav.Link eventKey="second">Tab 2</Nav.Link>
							</Nav.Item>
						</Nav>
					</Col>
					<Col sm={ 9 }>
						<Tab.Content>
							<Tab.Pane eventKey="first">
								<p>A simple solution for having tabbed content on a large screen but turn it into accordion on a smaller
									one when the time is right. Just resize your screen to see the tabbed interface transforming into an
									accordion.</p>
								<p>In order to keep the HTML as clean as possible, without duplicating elements, we use element
									attributes as CSS content to display the accordion tabs. <a class="more" href="https://www.gsarigiannidis.gr/tabs-on-desktop-accordion-on-mobile/" target="_blank" rel="noreferrer">Read more</a></p>
							</Tab.Pane>
							<Tab.Pane eventKey="second">
								<p>Tab 2 content. Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Donec odio. Quisque volutpat
									mattis eros. Nullam malesuada erat ut turpis. Suspendisse urna nibh, viverra non, semper suscipit,
									posuere a, pede. Nullam malesuada erat ut turpis. Suspendisse urna nibh, viverra non, semper suscipit,
									posuere a, pede.</p>
							</Tab.Pane>
						</Tab.Content>
					</Col>
				</Row>
			</Tab.Container>
		</div>
	)
}

export default TabAccordion
