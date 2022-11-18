const controls_menu = document.querySelector('#controls')

document.addEventListener('keydown', (event) => {
	if (event.code == 'KeyH') {
		if (controls_menu.style.display == 'flex') {
			controls_menu.style.display = 'none'
		} else {
			controls_menu.style.display = 'flex'
		}
	}
})

let running = false
function before_opening_sequence() {
	const before_title = document.querySelector('#before-title')
	const before_have_fun = before_title.querySelector('#before-have-fun')
	const before_continue = before_title.querySelector('#before-continue')

	setTimeout(() => {
		before_continue.classList.remove('hidden')
		before_continue.classList.add('fade-in-text')

		document.addEventListener('keydown', (event) => {
			if (event.code == 'KeyH') {
				if (controls_menu.style.display == 'flex') {
					controls_menu.style.display = 'none'
				} else {
					controls_menu.style.display = 'flex'
				}
			} else if (event.code == 'Enter' && running == false) {
				running = true
				before_have_fun.classList.remove('hidden')
				before_have_fun.classList.add('fade-in-text')

				setTimeout(() => {
					before_title.remove()
					opening_sequence()
				}, 5000) //5000
			}
		})
	}, 8000) // 8000
}

function opening_sequence() {
	let audio = new Audio('/static/resources/audio/songs/LBxS.mp3')
	audio.play()
	const title_screen = document.querySelector('#title-screen')
	const elements = document.querySelectorAll('#title-screen span')
	
	reveal_element(elements[0], 1000)
	reveal_element(elements[1], 3000)
	reveal_element(elements[2], 2000)
	hide_element(elements[0], 9000)
	hide_element(elements[1], 9000)
	hide_element(elements[2], 12000)

	reveal_element(elements[3], 14000)
	reveal_element(elements[4], 18000)
	reveal_element(elements[5], 24000)
	reveal_element(elements[6], 22000)
	hide_element(elements[3], 28000)
	hide_element(elements[4], 28000)
	hide_element(elements[5], 28000)
	hide_element(elements[6], 28000)

	reveal_element(elements[7], 35000)
	hide_element(elements[7], 39000)

	reveal_element(elements[8], 45000)
	reveal_element(elements[9], 49000)
	reveal_element(elements[10], 55000)
	hide_element(elements[8], 60000)
	hide_element(elements[9], 60000)
	hide_element(elements[10], 60000)

	reveal_element(elements[11], 65000)
	reveal_element(elements[12], 69000)
	hide_element(elements[11], 72000)
	hide_element(elements[12], 72000)

	reveal_element(elements[13], 76000)
	hide_element(elements[13], 78000)

	setTimeout(() => {
		audio.pause();
		audio.current_time = 0
		title_screen.remove()
	}, 80000)
}

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
			element.remove()
		}, 5000)
	}, time)
}

before_opening_sequence();