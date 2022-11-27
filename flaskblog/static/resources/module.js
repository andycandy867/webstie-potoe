// Returns a Promise that resolves after "ms" Milliseconds
const timer = ms => new Promise(res => setTimeout(res, ms))

function reveal_element(element, time) {
	window.setTimeout(() => {
		element.style.display = 'block'
		element.classList.add('fade-in-text')
	}, time)
}

function hide_element(element, time) {
	window.setTimeout(() => {
		element.classList.add('fade-out-text')

		window.setTimeout(() => {
			//element.remove()
			element.style.display = 'none'
		}, 5000)
	}, time)
}

export {timer, reveal_element, hide_element}