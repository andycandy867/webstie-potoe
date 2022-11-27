// Utilites
function redirect(destination) {
	location.href = destination
}

// Close Errors
const messages = document.querySelectorAll('.message')

messages.forEach(message => {
	let message_closer = message.querySelector('.message-closer')

	message_closer.addEventListener('click', () => {
		message.remove()
	})
})


// Preferences Menu
const kebab_img = document.querySelector('#kebab-img')
let preferences_menu = document.querySelector('#preferences-menu')

let preferences_menu_active = false

function hide_preferences_menu() {
	preferences_menu_active = false
	preferences_menu.style.display = 'none'
}

function show_preferences_menu() {
	preferences_menu_active = true
	preferences_menu.style.display = 'flex'
}

if (kebab_img) {
	kebab_img.addEventListener('click', e => {
		e.stopPropagation()

		if (preferences_menu_active == false) {
			show_preferences_menu()
		} else if (preferences_menu_active == true) {
			hide_preferences_menu()
		}
	})

	preferences_menu.addEventListener('click', e => {
		e.stopPropagation()
	})
}


// Profile Menu
const profile_img = document.querySelector('#profile-img')
const dropdown_menu = document.querySelector('#profile-menu')

let dropdown_menu_active = false

function hide_dropdown_menu() {
	dropdown_menu_active = false
	dropdown_menu.style.display = 'none'
}

function show_dropdown_menu() {
	dropdown_menu_active = true
	dropdown_menu.style.display = 'flex'
}

if (profile_img) {
	profile_img.addEventListener('click', e => {
		e.stopPropagation()

		if (dropdown_menu_active == false) {
			show_dropdown_menu()
		} else if (dropdown_menu_active == true) {
			hide_dropdown_menu()
		}
	})

	dropdown_menu.addEventListener('click', e => {
		e.stopPropagation()
	})
}


// Side Menu
const menu_img = document.querySelector('#menu-img')
const active_side_menu = document.querySelector('.left-nav')

const hidden_side_menu = document.querySelector('#side-menu')
let hidden_side_menu_active = false

function hide_hidden_side_menu() {
	hidden_side_menu_active = false
	hidden_side_menu.style.width = 0
	setTimeout(() => {hidden_side_menu.style.display = 'none'}, 50)

	active_side_menu.style.display = 'flex'
}

function show_hidden_side_menu() {
	active_side_menu.style.display = 'none'

	hidden_side_menu_active = true
	hidden_side_menu.style.display = 'flex'
	setTimeout(() => {hidden_side_menu.style.width = '240px'}, 5)
}

menu_img.addEventListener('click', e => {
	e.stopPropagation()

	if (hidden_side_menu_active == false) {
		show_hidden_side_menu()
	} else if (hidden_side_menu_active == true) {
		hide_hidden_side_menu()
	}
})

hidden_side_menu.addEventListener('click', e => {
	e.stopPropagation()
})

// Insert Media Menu
const insert_media_button = document.querySelector('#create-post-insert-button')
const insert_media_menu = document.querySelector('#create-post-insert-menu')

let insert_media_menu_active = false

function hide_insert_media_menu() {
	insert_media_menu_active = false
	insert_media_menu.style.display = 'none'
}

function show_insert_media_menu() {
	insert_media_menu_active = true
	insert_media_menu.style.display = 'flex'
}

if (insert_media_button) {
	insert_media_button.addEventListener('click', e => {
		e.stopPropagation()

		if (insert_media_menu_active == false) {
			show_insert_media_menu()
		} else if (insert_media_menu_active == true) {
			hide_insert_media_menu()
		}
	})
}

// Input Options Menu
const input_options_openers = document.querySelectorAll('.options-opener')

input_options_openers.forEach(element => {
	let input_options_menu = element.nextElementSibling

	element.addEventListener('click', e => {
		e.stopPropagation()

		if (input_options_menu.style.display == 'none') {
			input_options_menu.style.display = 'block'
		} else if (input_options_menu.style.display == 'block') {
			input_options_menu.style.display = 'none'
		}
	})
})

// Light/Dark Mode Switch
const theme_switch = document.querySelector('#theme-switch');
const current_theme = localStorage.getItem('theme') ? localStorage.getItem('theme') : null;

if (current_theme) {
	document.documentElement.setAttribute('data-theme', current_theme);

	if (current_theme === 'dark') {
		theme_switch.checked = true;
	}
} else {
	document.documentElement.setAttribute('data-theme', 'light')
}

function switch_theme(event) {
	if (event.target.checked) {
		document.documentElement.setAttribute('data-theme', 'dark');
		localStorage.setItem('theme', 'dark');
	} else {
		document.documentElement.setAttribute('data-theme', 'light');
		localStorage.setItem('theme', 'light');
	}
}

theme_switch.addEventListener('change', switch_theme, false);

// Hides All Menus
document.addEventListener('click', e => {
	if (preferences_menu_active) {
		hide_preferences_menu()
	}

	if (dropdown_menu_active) {
		hide_dropdown_menu()
	}

	if (hidden_side_menu_active) {
		hide_hidden_side_menu()		
	}

	if (insert_media_menu_active) {
		if (e.target.getAttribute('class') != 'uploaded-media-remove') {
			hide_insert_media_menu()
		}
	}
})


// Home Page
if (location.href.split('/')[3] == '') {
	// Infinite Load Posts
	const posts_container = document.querySelector('#posts-container')
	const fake_post = document.querySelector('#fake-post')
	const post_template = document.querySelector('#post-template')

	let home_posts_counter = 0

	function load_posts() {
		fetch(`/load_home?c=${home_posts_counter}`).then(response => {
			response.json().then(data => {
				if (!data.length) {
					fake_post.remove()
				}

				for (var i = 0; i < data.length; i++) {
					let template_clone = post_template.content.cloneNode(true)

					template_clone.querySelector('.post-user-img').setAttribute('src', `/static/images/profile_pics/${data[i]['image_file']}`)

					template_clone.querySelector('.post-header-info > a').setAttribute('href', `/user/${data[i]['author']}`)
					template_clone.querySelector('.post-header-info > a').innerText = data[i]['author']

					template_clone.querySelector('.post-header-info > span').innerText = `${data[i]['followers_count']} Followers`

					template_clone.querySelector('.post-title > a').setAttribute('href', `/post/${parseInt(data[i]['id'])}`)
					template_clone.querySelector('.post-title > a').innerText = data[i]['title']

					template_clone.querySelector('.post-title').innerHTML += `${data[i]['views']} views · `

					template_clone.querySelector('.post-title').innerHTML += data[i]['date_posted']

					template_clone.querySelector('.post-content').innerText = data[i]['content']

					posts_container.appendChild(template_clone)
					home_posts_counter += 1
				}
			})
		})
	}

	let post_intersection_observer = new IntersectionObserver(entries => {
		if (entries[0].intersectionRatio <= 0) {
			return
		}

		load_posts()
	})
	
	post_intersection_observer.observe(fake_post)
}

// Explore Page
if (location.href.split('/')[3] == 'explore') {
	console.log('explore')
}

// History
if (location.href.split('/')[3] == 'history') {
	// Infinite Load Posts
	const posts_container = document.querySelector('#posts-container')
	const fake_post = document.querySelector('#fake-post')
	const post_template = document.querySelector('#post-template')

	let history_posts_counter = 0

	function load_posts() {
		fetch(`/load_history?c=${history_posts_counter}`).then(response => {
			response.json().then(data => {
				if (!data.length) {
					fake_post.remove()
				}

				for (var i = 0; i < data.length; i++) {
					let template_clone = post_template.content.cloneNode(true)

					template_clone.querySelector('.post-user-img').setAttribute('src', `/static/images/profile_pics/${data[i]['image_file']}`)

					template_clone.querySelector('.post-header-info > a').setAttribute('href', `/user/${data[i]['author']}`)
					template_clone.querySelector('.post-header-info > a').innerText = data[i]['author']

					template_clone.querySelector('.post-header-info > span').innerText = `${data[i]['followers_count']} Followers`

					template_clone.querySelector('.post-title > a').setAttribute('href', `/post/${parseInt(data[i]['id'])}`)
					template_clone.querySelector('.post-title > a').innerText = data[i]['title']

					template_clone.querySelector('.post-title').innerHTML += `${data[i]['views']} views · `

					template_clone.querySelector('.post-title').innerHTML += data[i]['date_posted']

					template_clone.querySelector('.post-content').innerText = data[i]['content']

					posts_container.appendChild(template_clone)
					history_posts_counter += 1
				}
			})
		})
	}

	let post_intersection_observer = new IntersectionObserver(entries => {
		if (entries[0].intersectionRatio <= 0) {
			return
		}

		load_posts()
	})
	
	post_intersection_observer.observe(fake_post)
}

// Liked
if (location.href.split('/')[3] == 'liked') {
	// Infinite Load Posts
	const posts_container = document.querySelector('#posts-container')
	const fake_post = document.querySelector('#fake-post')
	const post_template = document.querySelector('#post-template')

	let liked_posts_counter = 0

	function load_posts() {
		fetch(`/load_liked?c=${liked_posts_counter}`).then(response => {
			response.json().then(data => {
				if (!data.length) {
					fake_post.remove()
				}

				for (var i = 0; i < data.length; i++) {
					let template_clone = post_template.content.cloneNode(true)

					template_clone.querySelector('.post-user-img').setAttribute('src', `/static/images/profile_pics/${data[i]['image_file']}`)

					template_clone.querySelector('.post-header-info > a').setAttribute('href', `/user/${data[i]['author']}`)
					template_clone.querySelector('.post-header-info > a').innerText = data[i]['author']

					template_clone.querySelector('.post-header-info > span').innerText = `${data[i]['followers_count']} Followers`

					template_clone.querySelector('.post-title > a').setAttribute('href', `/post/${parseInt(data[i]['id'])}`)
					template_clone.querySelector('.post-title > a').innerText = data[i]['title']

					template_clone.querySelector('.post-title').innerHTML += `${data[i]['views']} views · `

					template_clone.querySelector('.post-title').innerHTML += data[i]['date_posted']

					template_clone.querySelector('.post-content').innerText = data[i]['content']

					posts_container.appendChild(template_clone)
					liked_posts_counter += 1
				}

				if (data.length < 7) {
					fake_post.remove()
				}
			})
		})
	}

	let post_intersection_observer = new IntersectionObserver(entries => {
		if (entries[0].intersectionRatio <= 0) {
			return
		}

		load_posts()
	})
	
	post_intersection_observer.observe(fake_post)
}

// Post
if (location.href.split('/').length == 5 && + location.href.split('/')[4]) {
	/* Infinite Load Comments
	const comments_container = document.querySelector('#comment-section')
	const fake_comment = document.querySelector('#fake-comment')
	const comment_template = document.querySelector('#comment-template')


	let comments_counter = 0

	function load_comments() {
		fetch(`/load_home?c=${comments_counter}`).then(response => {
			response.json().then(data => {
				if (!data.length) {
					fake_comment.remove()
				}

				for (var i = 0; i < data.length; i++) {
					let template_clone = comment_template.content.cloneNode(true)

					template_clone.querySelector('.post-user-img').setAttribute('src', `/static/images/profile_pics/${data[i]['image_file']}`)

					template_clone.querySelector('.post-header > a').setAttribute('href', `/user/${data[i]['author']}`)
					template_clone.querySelector('.post-header > a').innerText = data[i]['author']

					template_clone.querySelector('.post-title > a').setAttribute('href', `/post/${parseInt(data[i]['id'])}`)
					template_clone.querySelector('.post-title > a').innerText = data[i]['title']
					template_clone.querySelector('.post-title').innerHTML += data[i]['date_posted']

					template_clone.querySelector('.post-content').innerText = data[i]['content']

					comments_container.appendChild(template_clone)
					comments_counter += 1
				}
			})
		})
	}

	let comment_intersection_observer = new IntersectionObserver(entries => {
		if (entries[0].intersectionRatio <= 0) {
			return
		}

		load_comments()
	})
	
	comment_intersection_observer.observe()
	*/

	// Delete Post Confirmation
	const post_delete_button = document.querySelector('#post-delete-button')

	if (post_delete_button) {
		const post_delete_modal = document.querySelector('#post-delete-modal')
		const post_delete_modal_cancel = post_delete_modal.querySelector('#post-delete-modal-close')
		const post_delete_modal_submit = post_delete_modal.querySelector('#post-delete-modal-submit')

		function display_post_delete_modal() {
			if (post_delete_modal.style.display == 'none') {
				post_delete_modal.style.display = 'block'
			}
		}

		function hide_post_delete_modal() {
			if (post_delete_modal.style.display == 'block') {
				post_delete_modal.style.display = 'none'
			}
		}

		function delete_post() {
			fetch(`/post/${location.href.split('/')[4]}/delete?post_temp_cache_1_0=0`, {
				method: 'POST'
			}).then(location.href = '/')
		}

		post_delete_button.addEventListener('click', display_post_delete_modal)
		post_delete_modal_cancel.addEventListener('click', hide_post_delete_modal)
		post_delete_modal_submit.addEventListener('click', delete_post)
	}

	// Follow User from Post
	const post_follow_button = document.querySelector('#follow-button')
	const post_followers_count = document.querySelector('#post-followers-container > span')

	function follow_user() {
		fetch('/user/follow', {
			method: 'POST',
			headers: {'Content-Type': 'application/json'},
			body: JSON.stringify({'post_id': location.href.split('post/')[1]}),
		}).then(response => {
			response.json().then(data => {
				if (data['status'] == 'success') {
					let following_status = data['following_status']
					let follower_count_split = post_followers_count.innerText.split(' ')
					let follower_count = follower_count_split[0]

					if (following_status == true) {
						post_follow_button.innerText = 'Following'
						follower_count_split[0] = Number(follower_count) + 1
						post_followers_count.innerText = follower_count_split.join(' ')
					} else if (following_status == false) {
						post_follow_button.innerText = 'Follow'
						follower_count_split[0] = Number(follower_count) - 1
						post_followers_count.innerText = follower_count_split.join(' ')
					}
				} else if (data['status'] == 'failure') {
					alert('Fatal Error: Please try again later')
				}
			})
		})
	}

	if (post_follow_button) {
		post_follow_button.addEventListener('click', follow_user)
	}

	// Post Like and Dislike
	const post_like_button = document.querySelector('#post-like')
	const post_dislike_button = document.querySelector('#post-dislike')

	const post_like_button_count = post_like_button.querySelector('span')
	const post_dislike_button_count = post_dislike_button.querySelector('span')

	function like_post(action) {
		fetch('/post_comment/like', {
			method: 'POST',
			headers: {'Content-Type': 'application/json'},
			body: JSON.stringify({'post_id': location.href.split('post/')[1], 'action': action}),
		}).then(response => {
			response.json().then(data => {
				if (data['status'] == 'success') {
					let previous_liked_status = data['previous_liked_status']

					let post_like_button_img = post_like_button.querySelector('.post-like-img')
					let post_dislike_button_img = post_dislike_button.querySelector('.post-dislike-img')

					let like_count = post_like_button_count.innerText
					let dislike_count = post_dislike_button_count.innerText

					if (action == 'like') {
						if (previous_liked_status == 'liked') {
							let new_post_like_button_img = document.createElement('i')
							new_post_like_button_img.setAttribute('class', 'post-like-img fa fa-thumbs-o-up')
							post_like_button_img.parentNode.replaceChild(new_post_like_button_img, post_like_button_img)

							post_like_button_count.innerText = `${Number(like_count) - 1}`
						} else if (previous_liked_status == 'disliked') {
							let new_post_like_button_img = document.createElement('i')
							new_post_like_button_img.setAttribute('class', 'post-like-img fa fa-thumbs-up')
							post_like_button_img.parentNode.replaceChild(new_post_like_button_img, post_like_button_img)

							let new_post_dislike_button_img = document.createElement('i')
							new_post_dislike_button_img.setAttribute('class', 'post-dislike-img fa fa-thumbs-o-down')
							post_dislike_button_img.parentNode.replaceChild(new_post_dislike_button_img, post_dislike_button_img)

							post_like_button_count.innerText = `${Number(like_count) + 1}`
							post_dislike_button_count.innerText = `${Number(dislike_count) - 1}`
						} else if (previous_liked_status == 'undefined') {
							let new_post_like_button_img = document.createElement('i')
							new_post_like_button_img.setAttribute('class', 'post-like-img fa fa-thumbs-up')
							post_like_button_img.parentNode.replaceChild(new_post_like_button_img, post_like_button_img)

							post_like_button_count.innerText = `${Number(like_count) + 1}`
						}
					} else if (action == 'dislike') {
						if (previous_liked_status == 'liked') {
							let new_post_like_button_img = document.createElement('i')
							new_post_like_button_img.setAttribute('class', 'post-like-img fa fa-thumbs-o-up')
							post_like_button_img.parentNode.replaceChild(new_post_like_button_img, post_like_button_img)

							let new_post_dislike_button_img = document.createElement('i')
							new_post_dislike_button_img.setAttribute('class', 'post-dislike-img fa fa-thumbs-down')
							post_dislike_button_img.parentNode.replaceChild(new_post_dislike_button_img, post_dislike_button_img)

							post_like_button_count.innerText = `${Number(like_count) - 1}`
							post_dislike_button_count.innerText = `${Number(dislike_count) + 1}`
						} else if (previous_liked_status == 'disliked') {
							let new_post_dislike_button_img = document.createElement('i')
							new_post_dislike_button_img.setAttribute('class', 'post-dislike-img fa fa-thumbs-o-down')
							post_dislike_button_img.parentNode.replaceChild(new_post_dislike_button_img, post_dislike_button_img)

							post_dislike_button_count.innerText = `${Number(dislike_count) - 1}`
						} else if (previous_liked_status == 'undefined') {
							let new_post_dislike_button_img = document.createElement('i')
							new_post_dislike_button_img.setAttribute('class', 'post-dislike-img fa fa-thumbs-down')
							post_dislike_button_img.parentNode.replaceChild(new_post_dislike_button_img, post_dislike_button_img)

							post_dislike_button_count.innerText = `${Number(dislike_count) + 1}`
						}
					}

				} else if (data['status'] == 'failure') {
					alert('Fatal Error: Please try again later')
				}
			})
		})
	}

	post_like_button.addEventListener('click', () => {
		like_post('like')
	})

	post_dislike_button.addEventListener('click', () => {
		like_post('dislike')
	})

	// Post Save Open & Close
	const post_save_opener = document.querySelector('#post-save-opener')

	post_save_opener.addEventListener('click', () => {
		
	})


	// Post Comment
	const comment_create = document.querySelector('#comment-create')
	const comment_create_input = comment_create.querySelector('.comment-input')

	const comment_create_options = comment_create.querySelector('#comment-create-options')
	const comment_create_cancel_button = comment_create.querySelector('#comment-create-cancel-button')
	const comment_create_comment_button = comment_create.querySelector('#comment-create-comment-button')

	let comment_create_options_hidden_status = false
	function show_comment_create_options() {
		if (comment_create_options_hidden_status == false) {
			comment_create_options.style.display = 'block'
			comment_create_options_hidden_status = true
		}
	}

	function hide_comment_create_options() {
		if (comment_create_options_hidden_status == true) {
			comment_create_options.style.display = 'none'
			comment_create_options_hidden_status = false
		}
	}

	comment_create_input.addEventListener('click', show_comment_create_options)
	comment_create_cancel_button.addEventListener('click', hide_comment_create_options)

	// View Comment Replies
	let comments = document.querySelectorAll('.comment')

	comments.forEach(comment => {
		let comment_replies = comment.querySelector('.comment-replies')
		let comment_view_replies = comment.querySelector('.comment-view-reply')

		if (comment_replies) {
			let comment_replies_visible = false
			comment_view_replies.addEventListener('click', () => {
				let comment_view_replies_img = comment.querySelector('.comment-view-reply-image')

				if (comment_replies_visible == false) {	
					let comment_view_replies_up_img = document.createElement('i')
					comment_view_replies_up_img.setAttribute('class', 'comment-view-reply-image fa fa-caret-up')
					comment_view_replies_img.parentNode.replaceChild(comment_view_replies_up_img, comment_view_replies_img)
					
					comment_replies.style.display = 'block'
					comment_replies_visible = true
				} else if (comment_replies_visible == true) {
					let comment_view_replies_down_img = document.createElement('i')
					comment_view_replies_down_img.setAttribute('class', 'comment-view-reply-image fa fa-caret-down')
					comment_view_replies_img.parentNode.replaceChild(comment_view_replies_down_img, comment_view_replies_img)

					comment_replies.style.display = 'none'
					comment_replies_visible = false
				}
			})
		}
	})

	// Comment Actions
	comments.forEach(comment => {
		let comment_reply_button = comment.querySelector('.comment-reply')
		let comment_comment_input = comment.querySelector('.comment-create')

		let comment_reply_cancel_button = comment.querySelector('.comment-reply-cancel-button')
		let comment_reply_submit_button = comment.querySelector('.comment-reply-submit-button')

		comment_reply_button.addEventListener('click', () => {
			if (comment_comment_input.style.display == 'none') {
				comment_comment_input.style.display = 'block'
			}
		})

		comment_reply_cancel_button.addEventListener('click', () => {
			if (comment_comment_input.style.display == 'block') {
				comment_comment_input.style.display = 'none'
			}
		})
	})


	// Comment like and dislike
	function like_comment(like_button, dislike_button, comment_id, action) {
		fetch(`/post_comment/like`, {
			method: 'POST',
			headers: {'Content-Type': 'application/json'},
			body: JSON.stringify({'comment_id': comment_id, 'action': action}),
		}).then(response => {
			response.json().then(data => {
				if (data['status'] == 'success') {
					let previous_liked_status = data['previous_liked_status']

					let comment_like_button_count = like_button.querySelector('span')
					let comment_dislike_button_count = dislike_button.querySelector('span')

					let comment_like_button_img = like_button.querySelector('.comment-like-img')
					let comment_dislike_button_img = dislike_button.querySelector('.comment-dislike-img')

					let like_count = comment_like_button_count.innerText
					let dislike_count = comment_dislike_button_count.innerText

					if (action == 'like') {
						if (previous_liked_status == 'liked') {
							let new_comment_like_button_img = document.createElement('i')
							new_comment_like_button_img.setAttribute('class', 'comment-like-img fa fa-thumbs-o-up')
							comment_like_button_img.parentNode.replaceChild(new_comment_like_button_img, comment_like_button_img)

							comment_like_button_count.innerText = `${Number(like_count) - 1}`
						} else if (previous_liked_status == 'disliked') {
							let new_comment_like_button_img = document.createElement('i')
							new_comment_like_button_img.setAttribute('class', 'comment-like-img fa fa-thumbs-up')
							comment_like_button_img.parentNode.replaceChild(new_comment_like_button_img, comment_like_button_img)

							let new_comment_dislike_button_img = document.createElement('i')
							new_comment_dislike_button_img.setAttribute('class', 'comment-dislike-img fa fa-thumbs-o-down')
							comment_dislike_button_img.parentNode.replaceChild(new_comment_dislike_button_img, comment_dislike_button_img)

							comment_like_button_count.innerText = `${Number(like_count) + 1}`
							comment_dislike_button_count.innerText = `${Number(dislike_count) - 1}`
						} else if (previous_liked_status == 'undefined') {
							let new_comment_like_button_img = document.createElement('i')
							new_comment_like_button_img.setAttribute('class', 'comment-like-img fa fa-thumbs-up')
							comment_like_button_img.parentNode.replaceChild(new_comment_like_button_img, comment_like_button_img)

							comment_like_button_count.innerText = `${Number(like_count) + 1}`
						}
					} else if (action == 'dislike') {
						if (previous_liked_status == 'liked') {
							let new_comment_like_button_img = document.createElement('i')
							new_comment_like_button_img.setAttribute('class', 'comment-like-img fa fa-thumbs-o-up')
							comment_like_button_img.parentNode.replaceChild(new_comment_like_button_img, comment_like_button_img)

							let new_comment_dislike_button_img = document.createElement('i')
							new_comment_dislike_button_img.setAttribute('class', 'comment-dislike-img fa fa-thumbs-down')
							comment_dislike_button_img.parentNode.replaceChild(new_comment_dislike_button_img, comment_dislike_button_img)

							comment_like_button_count.innerText = `${Number(like_count) - 1}`							
							comment_dislike_button_count.innerText = `${Number(dislike_count) + 1}`
						} else if (previous_liked_status == 'disliked') {
							let new_comment_dislike_button_img = document.createElement('i')
							new_comment_dislike_button_img.setAttribute('class', 'comment-dislike-img fa fa-thumbs-o-down')
							comment_dislike_button_img.parentNode.replaceChild(new_comment_dislike_button_img, comment_dislike_button_img)

							comment_dislike_button_count.innerText = `${Number(dislike_count) - 1}`
						} else if (previous_liked_status == 'undefined') {
							let new_comment_dislike_button_img = document.createElement('i')
							new_comment_dislike_button_img.setAttribute('class', 'comment-dislike-img fa fa-thumbs-down')
							comment_dislike_button_img.parentNode.replaceChild(new_comment_dislike_button_img, comment_dislike_button_img)

							comment_dislike_button_count.innerText = `${Number(dislike_count) + 1}`
						}
					}
				} else if (data['status'] == 'failure') {
					alert('Fatal Error: Please try again later')
				}
			})
		})
	}

	comments.forEach(comment => {
		let comment_id = comment.getAttribute("data-id")
		let comment_like_button = comment.querySelector('.comment-like')
		let comment_dislike_button = comment.querySelector('.comment-dislike')

		comment_like_button.addEventListener('click', () => {
			like_comment(comment_like_button, comment_dislike_button, comment_id, 'like')
		})

		comment_dislike_button.addEventListener('click', () => {
			like_comment(comment_like_button, comment_dislike_button, comment_id, 'dislike')
		})
	})

	// Update the amount of comments with a function because posting comment != 

	// Text Box Auto Resizing
	const comment_inputs = document.querySelectorAll(".comment-input");

	function autoResize() {
		this.style.height = '24px';
		this.style.height = this.scrollHeight + 'px';
	}

	comment_inputs.forEach(textarea => {
		textarea.addEventListener('input', autoResize);
	})
}

// Settings
if ((location.href.split('/').length == 4) && location.href.split('/')[3] == 'account' || location.href.split('/')[3] == 'settings') {
}

// Update Post
if (location.href.split('/').length == 6 && location.href.split('/')[5] == 'update') {
	// Add warning before leaving page
	let unsafe_to_leave = true

	const update_post_submit_button = document.querySelector('#update-post-submit-button')
	update_post_submit_button.addEventListener('click', () => {
		unsafe_to_leave = false
	})

	window.addEventListener('beforeunload', event => {
		if (unsafe_to_leave == true) {
			fetch(`/post/${location.href.split('/')[4]}/delete?post_temp_cache_1_0=1`, {
				method: 'POST'
			})

			event.preventDefault()
	 		event.returnValue = ''
		}
	})

	// Uploads Media Automatically after file input
	const import_file = document.querySelector('#import-file')
	const create_post_form = document.querySelector("#create-post-form")

	if (import_file) {
		import_file.onchange = () => {
			unsafe_to_leave = false
			create_post_form.requestSubmit()
		}
	}

	// Select Media to insert and then submit
	const media_selects = document.querySelectorAll(".uploaded-media")
	const hidden_file_input = document.querySelector("#file")

	function select_media() {
		unsafe_to_leave = false
		media_source = this.getAttribute('src')
		hidden_file_input.setAttribute('value', media_source.replace('/static/', ''))
		create_post_form.requestSubmit()
	}

	media_selects.forEach(media => {
		media.addEventListener('click', select_media)
	})

	// Hover over input element for more actions
	const input_elements = document.querySelectorAll('.input-element')

	function display_element_options() {
		let prevSibling = this.querySelector('div')
		prevSibling.style.display = 'block'
	}

	function hide_element_options() {
		let prevSibling = this.querySelector('div')
		prevSibling.style.display = 'none'
	}

	input_elements.forEach(element => {
		element.addEventListener('mouseover', display_element_options)
		element.addEventListener('mouseleave', hide_element_options)
	})

	// Activates Buttons from Imported Media
	const imported_medias_containers = document.querySelectorAll('.uploaded-media-container')

	function imported_media_remove() {
		let imported_media_container = this.parentElement.parentElement
		let imported_media_remove_button_id = this.getAttribute('id')
		let imported_media_id_split = imported_media_remove_button_id.split('-')
		let imported_media_id = imported_media_id_split[imported_media_id_split.length - 1]

		fetch('/post/delete_media', {
			method: 'POST',
			headers:{'Content-Type': 'application/json',},
			body: JSON.stringify({'media_id': imported_media_id}),
		}).then(response => {
			response.json().then(data => {
				if (data == 'success') {
					imported_media_container.remove()
				} else if (data == 'failure') {
					alert('Fatal Error: Please try again later')
				}
			})
		})
	}

	imported_medias_containers.forEach(element => {
		let button = element.querySelector('.uploaded-media-remove')
		button.addEventListener('click', imported_media_remove)
	})

	// Activates Buttons from Inserted Media
	const inserted_medias_containers = document.querySelectorAll('.inserted-media-container')

	inserted_medias_containers.forEach(element => {
		let inserted_media_image = element.querySelector('.inserted-media')
		let inserted_media_range_input = element.querySelector('.inserted-media-range-input')

		let inserted_media_range_input_id = inserted_media_range_input.getAttribute('id')
		let inserted_media_range_input_type = inserted_media_range_input_id.split('-')[1]

		inserted_media_range_input.addEventListener('input', () => {
			inserted_media_range_input.nextElementSibling.value = inserted_media_range_input.value + '%'
			inserted_media_image.style.width = inserted_media_range_input.value + '%'
		})

		let remove_button = element.querySelector('.inserted-media-remove')
		remove_button.addEventListener('click', () => {
			element.remove()
		})
	})

	// Activates Buttons from Inserted Textboxes
	const textarea_container = document.querySelectorAll('.textarea-container')

	textarea_container.forEach(element => {
		let remove_button = element.querySelector('.textarea-remove')
		remove_button.addEventListener('click', () => {
			element.remove()
		})
	})
}

// New Post
if (location.href.split('/')[4] && location.href.split('/')[4].split('?')[0] == 'new') {

	// Uploads Media Automatically after file input
	const import_file = document.querySelector('#import-file')
	const create_post_form = document.querySelector("#create-post-form")

	if (import_file) {
		import_file.onchange = () => {
			create_post_form.requestSubmit()
		}
	}

	// Select Media to insert and then submit
	const media_selects = document.querySelectorAll(".uploaded-media")
	const hidden_file_input = document.querySelector("#file")

	function select_media() {
		media_source = this.getAttribute('src')
		hidden_file_input.setAttribute('value', media_source.replace('/static/', ''))
		create_post_form.requestSubmit()
	}

	media_selects.forEach(media => {
		media.addEventListener('click', select_media)
	})

	// Hover over input element for more actions
	const input_elements = document.querySelectorAll('.input-element')

	function display_element_options() {
		let prevSibling = this.querySelector('div')
		prevSibling.style.display = 'block'
	}

	function hide_element_options() {
		let prevSibling = this.querySelector('div')
		prevSibling.style.display = 'none'
	}

	input_elements.forEach(element => {
		element.addEventListener('mouseover', display_element_options)
		element.addEventListener('mouseleave', hide_element_options)
	})

	// Activates Buttons from Imported Media
	const imported_medias_containers = document.querySelectorAll('.uploaded-media-container')

	function imported_media_remove() {
		let imported_media_container = this.parentElement.parentElement
		let imported_media_remove_button_id = this.getAttribute('id')
		let imported_media_id_split = imported_media_remove_button_id.split('-')
		let imported_media_id = imported_media_id_split[imported_media_id_split.length - 1]

		fetch('/post/delete_media', {
			method: 'POST',
			headers:{'Content-Type': 'application/json'},
			body: JSON.stringify({'media_id': imported_media_id}),
		}).then(response => {
			response.json().then(data => {
				if (data == 'success') {
					imported_media_container.remove()
				} else if (data == 'failure') {
					alert('Fatal Error: Please try again later')
				}
			})
		})
	}

	imported_medias_containers.forEach(element => {
		let button = element.querySelector('.uploaded-media-remove')
		button.addEventListener('click', imported_media_remove)
	})

	// Activates Buttons from Inserted Media
	const inserted_medias_containers = document.querySelectorAll('.inserted-media-container')

	inserted_medias_containers.forEach(element => {
		let inserted_media_image = element.querySelector('.inserted-media')
		let inserted_media_range_input = element.querySelector('.inserted-media-range-input')

		let inserted_media_range_input_id = inserted_media_range_input.getAttribute('id')
		let inserted_media_range_input_type = inserted_media_range_input_id.split('-')[1]

		inserted_media_range_input.addEventListener('input', () => {
			inserted_media_range_input.nextElementSibling.value = inserted_media_range_input.value + '%'
			inserted_media_image.style.width = inserted_media_range_input.value + '%'
		})

		let remove_button = element.querySelector('.inserted-media-remove')
		remove_button.addEventListener('click', () => {
			element.remove()
			autosave_post()
		})
	})

	// Activates Buttons from Inserted Textboxes
	const textarea_container = document.querySelectorAll('.textarea-container')

	textarea_container.forEach(element => {
		let remove_button = element.querySelector('.textarea-remove')
		remove_button.addEventListener('click', () => {
			element.remove()
			autosave_post()
		})
	})

	// Autosave Post
	const input_elements_id_not_allowed = ['file', 'csrf_token', 'import-file', 'new-post-submit-button']

	function take_post_overview() {
		let input_elements = create_post_form.querySelectorAll('input, textarea')
		let filtered_input_elements = {}

		input_elements.forEach(element => {
			if (!(input_elements_id_not_allowed.includes(element.getAttribute('id')))) {
				filtered_input_elements[element.getAttribute('name')] = element.getAttribute('value') || element.value
			}
		})

		return filtered_input_elements
	}

	let time_before_save = 3
	let post_overview = JSON.stringify(take_post_overview())

	function autosave_post() {
		time_before_save -= 1
		if (time_before_save == 0 && post_overview != JSON.stringify(take_post_overview())) {
			post_overview = take_post_overview()
			fetch(`/post/save?post_cache_id=${location.href.split('=')[1]}`, {
				method: 'POST',
				headers:{'Content-Type': 'application/json',},
				body: JSON.stringify(post_overview),
			}).then(response => {
				response.json().then(data => {
					if (data == 'success') {
						// pass
					} else if (data == 'failure') {
						alert('Fatal Error: Post wasn\'t saved')
					}
				})
			})
		}
	}

	window.addEventListener('keydown', e => {
		time_before_save = 5
	});

	setInterval(autosave_post, 1000)
}

// Post Caches
if (location.href.split('/')[4] && location.href.split('/')[4] == 'caches') {
	// Hover Over Post Caches For More Information
	const post_caches = document.querySelectorAll('.post-cache')

	function display_element_options_opener() {
		this.querySelector('img').style.display = 'block'
	}

	function hide_post_cache_options() {
		this.querySelector('img').style.display = 'none'
	}

	function delete_post_cache(element) {
		fetch('/post_cache/delete', {
			method: 'POST',
			headers:{'Content-Type': 'application/json',},
			body: JSON.stringify({'post_cache_id': element.id.split('-').pop()}),
		}).then(response => {
			response.json().then(data => {
				if (data == 'success') {
					element.remove()
				} else if (data == 'failure') {
					alert('Fatal Error: Please try again later')
				}
			})
		})
	}

	post_caches.forEach(element => {
		element.addEventListener('mouseover', display_element_options_opener)
		element.addEventListener('mouseleave', hide_post_cache_options)

		// Activates buttons from post cache dropdown
		element.querySelector('.post-cache-delete').addEventListener('click', event => {
			event.stopPropagation()
			delete_post_cache(element)
		})
	})
}