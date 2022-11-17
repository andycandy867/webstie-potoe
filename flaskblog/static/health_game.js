const dialogue_box = document.querySelector('#dialogue-box')

function opening_sequence() {
	const title_screen = document.querySelector('#title-screen')
	const health_project_title = title_screen.querySelector('span:nth-child(1)')
	const health_project_label = title_screen.querySelector('span:nth-child(2)')
	const health_project_author_name = title_screen.querySelector('span:nth-child(3)')
	const health_project_recommendation = title_screen.querySelector('span:nth-child(4)')
	const play_button = title_screen.querySelector('#play-button')
	reveal_element(health_project_label, 3000)
	reveal_element(health_project_author_name, 5000)
	reveal_element(health_project_recommendation, 6000)
	reveal_element(play_button, 8000)

	play_button.addEventListener("click", () => {
		health_project_label.classList.add('fade-out-text')
		health_project_author_name.classList.add('fade-out-text')
		health_project_recommendation.classList.add('fade-out-text')
		play_button.classList.add('fade-out-text')

		window.setTimeout(() => {
			title_screen.classList.add('fade-out-text')
			health_project_label.remove()
			health_project_author_name.remove()
			health_project_recommendation.remove()
			play_button.remove()
		}, 5000)

		window.setTimeout(() => {
			title_screen.remove()
		}, 10000)
	})
}

function reveal_element(element, time) {
	window.setTimeout(() => {
		element.style.display = 'block'
		element.classList.add('fade-in-text')
	}, time)
}

opening_sequence()