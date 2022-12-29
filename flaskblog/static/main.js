// Utilites
function redirect(destination) {
	location.href = destination;
}

function is_whole_number(value) {
	return /^\d+$/.test(value);
}

function toggle_element_visibility(element, on) {
	if (element.style.display == on) {
		element.style.display = "none";
	} else if (element.style.display == "none") {
		element.style.display = on;
	}
}

function create_new_svg(width, height, viewBox) {
	const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
	svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
	svg.setAttribute("width", `${width}px`);
	svg.setAttribute("height", `${height}px`);
	svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
	svg.setAttribute("viewBox", viewBox);

	return svg;
}


// Scroll history to manual, each reload will set back to start of page
// history.scrollRestoration = 'manual';


// Close Errors
const messages = document.querySelectorAll(".message");

messages.forEach(message => {
	let message_closer = message.querySelector(".message-closer");

	message_closer.addEventListener("click", () => {
		message.remove();
	})
})


// Preferences Menu
const kebab_img = document.querySelector("#kebab-img");
const preferences_menu = document.querySelector("#preferences-menu");

if (kebab_img) {
	kebab_img.addEventListener("click", e => {
		e.stopPropagation();

		if (preferences_menu.style.display == "none") {
			preferences_menu.style.display = "flex";
		} else if (preferences_menu.style.display == "flex") {
			preferences_menu.style.display = "none";
		}
	})

	preferences_menu.addEventListener("click", e => {
		e.stopPropagation();
	})
}


// Profile Menu
const profile_img = document.querySelector("#profile-img");
const dropdown_menu = document.querySelector("#profile-menu");

let dropdown_menu_active = false

function hide_dropdown_menu() {
	dropdown_menu_active = false
	dropdown_menu.style.display = "none"
}

function show_dropdown_menu() {
	dropdown_menu_active = true
	dropdown_menu.style.display = "flex"
}

if (profile_img) {
	profile_img.addEventListener("click", e => {
		e.stopPropagation()

		if (dropdown_menu_active == false) {
			show_dropdown_menu()
		} else if (dropdown_menu_active == true) {
			hide_dropdown_menu()
		}
	})

	dropdown_menu.addEventListener("click", e => {
		e.stopPropagation()
	})
}


// Side Menu
const side_menu_button = document.querySelector("#side-menu-button")
const active_side_menu = document.querySelector(".left-nav")

const hidden_side_menu = document.querySelector("#side-menu")
let hidden_side_menu_active = false

function hide_hidden_side_menu() {
	hidden_side_menu_active = false
	hidden_side_menu.style.width = 0
	setTimeout(() => {hidden_side_menu.style.display = "none"}, 50)

	active_side_menu.style.display = "flex"
}

function show_hidden_side_menu() {
	active_side_menu.style.display = "none"

	hidden_side_menu_active = true
	hidden_side_menu.style.display = "flex"
	setTimeout(() => {hidden_side_menu.style.width = "224px"}, 5)
}

side_menu_button.addEventListener("click", e => {
	e.stopPropagation()

	if (hidden_side_menu_active == false) {
		show_hidden_side_menu()
	} else if (hidden_side_menu_active == true) {
		hide_hidden_side_menu()
	}
})

hidden_side_menu.addEventListener("click", e => {
	e.stopPropagation()
})


// Toggle Collections
const collections_expanded = document.querySelector("#collections-expanded");
const collections_expand_button = document.querySelector("#collections-expand-button");
const collections_collapse_button = document.querySelector("#collections-collapse-button");

function expand_collections() {
	collections_expanded.style.display = "flex";
	collections_expand_button.style.display = "none";
}

function collapse_collections() {
	collections_expanded.style.display = "none";
	collections_expand_button.style.display = "flex";
}

if (collections_expanded) {
	collections_expand_button.addEventListener("click", expand_collections);
	collections_collapse_button.addEventListener("click", collapse_collections);
}

// Input Options Menu
const input_options_openers = document.querySelectorAll(".options-opener")

input_options_openers.forEach(element => {
	let input_options_menu = element.nextElementSibling

	element.addEventListener("click", e => {
		e.stopPropagation()

		if (input_options_menu.style.display == "none") {
			input_options_menu.style.display = "block"
		} else if (input_options_menu.style.display == "block") {
			input_options_menu.style.display = "none"
		}
	})
})


// Light/Dark Mode Switch
const theme_switch = document.querySelector("#theme-switch");
const current_theme = localStorage.getItem("theme") ? localStorage.getItem("theme") : null;

if (current_theme) {
	document.documentElement.setAttribute("data-theme", current_theme);

	if (current_theme === "dark") {
		theme_switch.checked = true;
	}
} else {
	document.documentElement.setAttribute("data-theme", "light")
}

function switch_theme(event) {
	if (event.target.checked) {
		document.documentElement.setAttribute("data-theme", "dark");
		localStorage.setItem("theme", "dark");
	} else {
		document.documentElement.setAttribute("data-theme", "light");
		localStorage.setItem("theme", "light");
	}
}

theme_switch.addEventListener("change", switch_theme, false);


// Hides All Menus
document.addEventListener("click", e => {
	if (preferences_menu && preferences_menu.style.display == "flex") {
		preferences_menu.style.display = "none";
	}

	if (dropdown_menu_active) {
		hide_dropdown_menu()
	}

	if (hidden_side_menu_active) {
		hide_hidden_side_menu()		
	}
})


function infinite_load_posts(fetch_url) {
	const posts_container = document.querySelector("#posts-container")
	const fake_post = document.querySelector("#fake-post")
	const post_template = document.querySelector("#post-template")

	let posts_counter = 0

	let post_intersection_observer = new IntersectionObserver(entries => {
		if (entries[0].intersectionRatio <= 0) {
			return;
		}

		//Load Posts
		fetch(`${fetch_url}${posts_counter}`).then(response => {
			response.json().then(data => {
				if (!data.length) {
					fake_post.remove()
				}

				for (var i = 0; i < data.length; i++) {
					let template_clone = post_template.content.cloneNode(true);

					fill_in_template_clone(template_clone, data[i]);

					posts_container.appendChild(template_clone);
					posts_counter += 1;

					const appended_post = posts_container.querySelector(`.post-container:nth-child(${posts_counter})`);
					setup_post(appended_post);
				}
			})
		})
	})
	
	post_intersection_observer.observe(fake_post)
}

function fill_in_template_clone(template_clone, data) {
	template_clone.querySelector(".post-container").setAttribute("data-id", data["id"]);
	template_clone.querySelector(".post-container").setAttribute("data-collections", JSON.stringify(data["collections_apart_of"]));

	template_clone.querySelector(".post-author > a").setAttribute("href", `/user/${data["author"]}`);
	template_clone.querySelector(".post-author > a").setAttribute("title", `${data["author"]}`);
	template_clone.querySelector(".post-user-img").setAttribute("src", `/static/images/profile_pics/${data["image_file"]}`);

	template_clone.querySelector(".post-header-info > a").setAttribute("href", `/user/${data["author"]}`);
	template_clone.querySelector(".post-header-info > a").setAttribute("title", data["author"]);
	template_clone.querySelector(".post-header-info > a").innerText = data["author"];

	template_clone.querySelector(".post-header-info > span").innerText = `${data["followers_count"]} Followers`;

	template_clone.querySelector(".post-title > a").setAttribute("href", `/post/${parseInt(data["id"])}`);
	template_clone.querySelector(".post-title > a").setAttribute("title", data["title"]);
	template_clone.querySelector(".post-title > a").innerText = data["title"];

	template_clone.querySelector(".post-title").innerHTML += `${data["views"]} views · `;

	template_clone.querySelector(".post-title").innerHTML += data["date_posted"];

	template_clone.querySelector(".post-content").innerText = data["content"];
}


// Hover over post for more options | post options toggle
let post_options_active = null;
let post_options_button_active = null;

function handle_post_options(post) {
	const post_options_button = post.querySelector(".post-options-button");
	const post_options = post.querySelector(".post-options");

	post.addEventListener("mouseover", () => {
		post_options_button.style.display = "block";
	})

	post.addEventListener("mouseleave", () => {
		if (post_options_active != post_options) {
			post_options_button.style.display = "none";
		}
	})

	post_options_button.addEventListener("click", () => {
		if (post_options.style.display == "flex") {
			post_options_active = null;
			post_options.style.display = "none";
		} else if (post_options.style.display == "none") {
			if (post_options_active) {
				post_options_active.style.display = "none";
				post_options_button_active.style.display = "none";
			}

			post_options_active = post_options;
			post_options_button_active = post_options_button;
			post_options.style.display = "flex";
		}
	})
}


// If current_user.is_authenticated
const post_save_modal = document.querySelector("#post-save-modal");

if (post_save_modal) {
	// Setup Collection Posts
	function setup_post(post) {
		handle_post_options(post);
		handle_post_save_read_later(post);
		handle_post_save(post);
	}


	// Save Post To Read Later
	function handle_post_save_read_later(post) {
		const collection_post_save_read_later_button = post.querySelector(".collection-post-save-read-later-button");

		const post_id = post.dataset.id;

		collection_post_save_read_later_button.addEventListener("click", () => {
			add_post_to_collection("RL", post_id);
		});
	}


	// Post Save Open & Close
	const post_save_collections = post_save_modal.querySelectorAll(".post-save-collection");
	const post_save_closer = post_save_modal.querySelector("#post-save-close");

	function handle_post_save(post) {
		const post_save_opener = post.querySelector(".post-save-opener");
		
		post_save_opener.addEventListener("click", () => {
			post_save_show(post);
		});
	}

	function post_save_show(post) {
		const post_collections = post.dataset.collections;

		post_save_collections.forEach(collection => {
			const collection_id = collection.dataset.collectionId;
			const collection_checkbox = collection.querySelector("input[type=checkbox]");

			if (post_collections.includes(collection_id)) {
				collection_checkbox.checked = true;
			} else {
				collection_checkbox.checked = false;
			}
		});

		selected_post = post;
		post_save_modal.style.display = "flex";
	}

	function post_save_hide() {
		selected_post = null;
		post_save_modal.style.display = "none";
	}

	post_save_closer.addEventListener("click", post_save_hide);


	// Setup Collections
	const collections = post_save_modal.querySelectorAll(".post-save-collection");

	collections.forEach(collection => {
		setup_collection(collection);
	});

	let selected_post = null;
	function setup_collection(collection) {
		const collection_id = collection.dataset.collectionId;
		const checkbox = collection.querySelector("input");
		const button = collection.querySelector("button");

		checkbox.addEventListener("change", () => {
			update_post_to_collection(collection_id, selected_post, checkbox);
		});

		button.addEventListener("click", () => {
			update_post_to_collection(collection_id, selected_post, checkbox);
		});
	}

	function add_post_to_collection(collection_id, post_id) {
		fetch(`/collection/edit?list=${collection_id}&action=add`, {
			method: "POST",
			headers: {"Content-Type": "application/json"},
			body: JSON.stringify({"post_id": post_id})
		}).then(response => {
			response.json().then(data => {
				if (data["status"] == "failure") {
					alert("Fatal Error: Please try again later");
				}
			});
		});
	}

	function update_post_to_collection(collection_id, post, checkbox) {
		const post_id = post.dataset.id;
		collection_id = Number(collection_id);

		fetch(`/collection/edit?list=${collection_id}&action=update`, {
			method: "POST",
			headers: {"Content-Type": "application/json"},
			body: JSON.stringify({"post_id": post_id})
		}).then(response => {
			response.json().then(data => {
				if (data["status"] == "success") {
					let new_post_collections = JSON.parse(post.dataset.collections);

					if (data["in_collection"]) {
						new_post_collections.push(collection_id);
						checkbox.checked = true;
					} else {
						const index = new_post_collections.indexOf(collection_id);

						if (index > -1) {
							new_post_collections.splice(index, 1);
						}

						checkbox.checked = false;
					}

					post.dataset.collections = JSON.stringify(new_post_collections);
				} else if (data["status"] == "failure") {
					alert("Fatal Error: Please try again later");
				}
			});
		});
	}


	// Create Collection Toggle
	const create_collection_container = post_save_modal.querySelector("#create-collection-container");

	const create_collection_button = post_save_modal.querySelector("#post-save-create-new");
	const create_collection_cancel = post_save_modal.querySelector("#create-collection-cancel");

	function toggle_collection_creation() {
		if (create_collection_container.style.display == "none") {
			create_collection_name.value = null;
			create_collection_container.style.display = "block";
			create_collection_button.style.display = "none";
		} else {
			create_collection_container.style.display = "none";
			create_collection_button.style.display = "flex";
		}
	}

	create_collection_button.addEventListener("click", toggle_collection_creation);
	create_collection_cancel.addEventListener("click", toggle_collection_creation);


	// Create Collection
	const create_collection_name = post_save_modal.querySelector("#create-collection-name");
	const create_collection_submit = post_save_modal.querySelector("#create-collection-submit");

	function create_collection() {	
		fetch(`/collection/create`, {
			method: "POST",
			headers: {"Content-Type": "application/json"},
			body: JSON.stringify({"name": create_collection_name.value})
		}).then(response => {
			response.json().then(data => {
				if (data["status"] == "success") {
					let clone = post_save_modal.querySelector(".post-save-collection").cloneNode(true);

					clone.dataset.collectionId = data["collection_id"];
					clone.querySelector("input").checked = false;
					clone.querySelector("button").innerText = data["collection_name"];
					post_save_modal.querySelector("#post-save-collections").appendChild(clone);
					setup_collection(clone);
				} else if (data["status"] == "failure") {
					alert("Fatal Error: Please try again later");
				}
			});
		});

		toggle_collection_creation();
	}

	create_collection_submit.addEventListener("click", create_collection);
} else {
	function setup_post(post) {
		handle_post_options(post);
	}
}


// Only Setup Posts that aren't infintly loaded, as those are already setup while being declared
const post_pages = ["/explore", "/following", "/library"];

if (post_pages.includes(window.location.pathname)) {
	const posts = document.querySelectorAll(".post-container");

	posts.forEach(post => {
		setup_post(post);
	});
}


// Home Page
if (window.location.pathname == "/") {
	infinite_load_posts("/load_home?c=");
	/*
	// Infinite Load Posts
	const posts_container = document.querySelector("#posts-container")
	const fake_post = document.querySelector("#fake-post")
	const post_template = document.querySelector("#post-template")

	let home_posts_counter = 0

	function load_posts() {
		fetch(`/load_home?c=${home_posts_counter}`).then(response => {
			response.json().then(data => {
				if (!data.length) {
					fake_post.remove()
				}

				for (var i = 0; i < data.length; i++) {
					let template_clone = post_template.content.cloneNode(true)

					template_clone.querySelector(".post-header > a").setAttribute("href", `/user/${data[i]["author"]}`)
					template_clone.querySelector(".post-user-img").setAttribute("src", `/static/images/profile_pics/${data[i]["image_file"]}`)

					template_clone.querySelector(".post-header-info > a").setAttribute("href", `/user/${data[i]["author"]}`)
					template_clone.querySelector(".post-header-info > a").innerText = data[i]["author"]

					template_clone.querySelector(".post-header-info > span").innerText = `${data[i]["followers_count"]} Followers`

					template_clone.querySelector(".post-title > a").setAttribute("href", `/post/${parseInt(data[i]["id"])}`)
					template_clone.querySelector(".post-title > a").innerText = data[i]["title"]

					template_clone.querySelector(".post-title").innerHTML += `${data[i]["views"]} views · `

					template_clone.querySelector(".post-title").innerHTML += data[i]["date_posted"]

					template_clone.querySelector(".post-content").innerText = data[i]["content"]

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
	*/
}

// Results Page
if (window.location.pathname == "/results") {
	// Toggle Filter Menu
	const filter_button = document.querySelector("#search-filter-button");
	const filter_menu = document.querySelector("#search-filter-menu");

	filter_button.addEventListener("click", () => {
		toggle_element_visibility(filter_menu, "flex");
	});
}


// Explore Page
if (window.location.pathname == "/explore") {
	console.log("Explore");
}


// History
if (window.location.pathname == "/history") {
	infinite_load_posts("/load_history?c=");
}


// Liked
if (window.location.pathname == "/liked") {
	infinite_load_posts("/load_liked?c=");
}


// Collection
if (window.location.pathname === "/collection") {
	// Toggle Collection Options
	const collection_options_button = document.querySelector("#collection-options-button");
	const collection_options_menu = document.querySelector("#collection-options-menu");

	function toggle_collection_options_menu() {
		if (collection_options_menu.style.display === "none") {
			collection_options_menu.style.display = "flex";
		} else if (collection_options_menu.style.display === "flex") {
			collection_options_menu.style.display = "none";
		}
	}

	function hide_collection_options_menu() {
		collection_options_menu.style.display = "none";
	}


	if (collection_options_button) {
		collection_options_button.addEventListener("click", e => {
			e.stopPropagation();
			toggle_collection_options_menu();
		});

		document.addEventListener("click", hide_collection_options_menu);
	}


	// Rename Collection
	const collection_rename_button = document.querySelector("#collection-rename-button");
	const collection_info_title = document.querySelector(".collection-info-title > h2");
	const collection_rename_form = document.querySelector("#collection-rename-form");

	function show_collection_rename_form() {
		collection_rename_form.style.display = "flex";
		collection_rename_form.querySelector("#collection-rename-input").focus();
		collection_rename_button.style.display = "none"
		collection_info_title.style.display = "none"
	}

	function hide_collection_rename_form() {
		collection_rename_form.style.display = "none";
		collection_rename_button.style.display = "block"
		collection_info_title.style.display = "block"
	}


	// Show/Hide Collection Modal
	const collection_change_image_modal = document.querySelector("#collection-change-image-modal");
	const collection_image = document.querySelector(".collection-image");
	const collection_change_image_preview_image = document.querySelector("#collection-change-image-preview-image > img");
	const collection_change_image_form_input = document.querySelector("#collection-change-image-form-input");

	function show_collection_change_image_modal() {
		collection_change_image_modal.style.display = "flex";
	}

	function hide_collection_change_image_modal() {
		collection_change_image_modal.style.display = "none";
		collection_change_image_preview_image.src = collection_image.src;
		collection_change_image_form_input.value = null;
	}


	// Change Collection Image | Upload Image
	function show_collection_change_image_form_input() {
		collection_change_image_form_input.click();
	}

	if (collection_change_image_form_input) {
		collection_change_image_form_input.addEventListener("change", () => {
			const file = collection_change_image_form_input.files[0];

			if (file) {
				collection_change_image_preview_image.src = URL.createObjectURL(file);
			}
		})
	}


	// Submit Collection Change Image Form Automatically
	const collection_change_image_form = document.querySelector("#collection-change-image-form");

	function submit_collection_change_image_form() {
		collection_change_image_form.requestSubmit();
	}


	// Hover over collection post for more options | Collection post options toggle
	function handle_collection_post_options(post) {
		const post_options_button = post.querySelector(".post-options-button");
		const post_options = post.querySelector(".post-options");

		post.addEventListener("mouseover", () => {
			post_options_button.style.display = "block";
		});

		post.addEventListener("mouseleave", () => {
			post_options_button.style.display = "none";
			hide_collection_post_options(post_options);
		});

		post_options_button.addEventListener("click", () => {
			toggle_collection_post_options(post_options);
		});
	}

	function toggle_collection_post_options(post_options) {
		if (post_options.style.display == "flex") {
			post_options.style.display = "none";
		} else if (post_options.style.display == "none") {
			post_options.style.display = "flex";
		}
	}

	function hide_collection_post_options(post_options) {
		post_options.style.display = "none";
	}


	// Remove Collection Post
	function handle_collection_post_remove(post) {
		const remove_collection_post_button = post.querySelector(".collection-post-remove-button");

		if (remove_collection_post_button) {
			const collection_id = window.location.search.split("=")[1];
			const post_id = post.dataset.id;

			remove_collection_post_button.addEventListener("click", () => {
				remove_post_from_collection(post, collection_id, post_id);
			});
		}
	}

	function remove_post_from_collection(post, collection_id, post_id) {
		fetch(`/collection/edit?list=${collection_id}&action=remove`, {
			method: "POST",
			headers: {"Content-Type": "application/json"},
			body: JSON.stringify({"post_id": post_id})
		}).then(response => {
			response.json().then(data => {
				if (data["status"] == "success") {
					post.remove();
				} else if (data["status"] == "failure") {
					alert("Fatal Error: Please try again later");
				}
			});
		});
	}


	// Save Post To Read Later
	function handle_collection_post_save_read_later(post) {
		const collection_post_save_read_later_button = post.querySelector(".collection-post-save-read-later-button");

		if (collection_post_save_read_later_button) {
			const post_id = post.dataset.id;

			collection_post_save_read_later_button.addEventListener("click", () => {
				add_post_to_collection("RL", post_id);
			});
		}
	}


	// Post Save Open & Close
	const post_save_modal = document.querySelector("#post-save-modal");
	const post_save_collections = post_save_modal.querySelectorAll(".post-save-collection");
	const post_save_closer = post_save_modal.querySelector("#post-save-close");

	function handle_collection_post_save(post) {
		const post_save_opener = post.querySelector(".post-save-opener");
		
		post_save_opener.addEventListener("click", () => {
			post_save_show(post);
		});
	}

	function post_save_show(post) {
		const post_collections = post.dataset.collections;

		post_save_collections.forEach(collection => {
			const collection_id = collection.dataset.collectionId;
			const collection_checkbox = collection.querySelector("input[type=checkbox]");

			if (post_collections.includes(collection_id)) {
				collection_checkbox.checked = true;
			} else {
				collection_checkbox.checked = false;
			}
		});

		selected_post = post;
		post_save_modal.style.display = "flex";
	}

	function post_save_hide() {
		selected_post = null;
		post_save_modal.style.display = "none";
	}

	post_save_closer.addEventListener("click", post_save_hide);


	// Update Collection
	const collections = post_save_modal.querySelectorAll(".post-save-collection");

	collections.forEach(collection => {
		setup_collection(collection);
	});

	let selected_post = null;
	function setup_collection(collection) {
		const collection_id = collection.dataset.collectionId;
		const checkbox = collection.querySelector("input");
		const button = collection.querySelector("button");

		checkbox.addEventListener("change", () => {
			update_post_to_collection(collection_id, selected_post, checkbox);
		});

		button.addEventListener("click", () => {
			update_post_to_collection(collection_id, selected_post, checkbox);
		});
	}

	function add_post_to_collection(collection_id, post_id) {
		fetch(`/collection/edit?list=${collection_id}&action=add`, {
			method: "POST",
			headers: {"Content-Type": "application/json"},
			body: JSON.stringify({"post_id": post_id})
		}).then(response => {
			response.json().then(data => {
				if (data["status"] == "failure") {
					alert("Fatal Error: Please try again later");
				}
			});
		});
	}

	function update_post_to_collection(collection_id, post, checkbox) {
		collection_id = Number(collection_id)
		const post_id = post.dataset.id;

		fetch(`/collection/edit?list=${collection_id}&action=update`, {
			method: "POST",
			headers: {"Content-Type": "application/json"},
			body: JSON.stringify({"post_id": post_id})
		}).then(response => {
			response.json().then(data => {
				if (data["status"] == "success") {
					let new_post_collections = JSON.parse(post.dataset.collections);

					if (data["in_collection"]) {
						new_post_collections.push(collection_id);
						checkbox.checked = true;
					} else {
						const index = new_post_collections.indexOf(collection_id);

						if (index > -1) {
							new_post_collections.splice(index, 1);
						}

						checkbox.checked = false;
					}

					post.dataset.collections = JSON.stringify(new_post_collections);
				} else if (data["status"] == "failure") {
					alert("Fatal Error: Please try again later");
				}
			});
		});
	}


	// Create Collection Toggle
	const create_collection_container = post_save_modal.querySelector("#create-collection-container");

	const create_collection_button = post_save_modal.querySelector("#post-save-create-new");
	const create_collection_cancel = post_save_modal.querySelector("#create-collection-cancel");

	function toggle_collection_creation() {
		if (create_collection_container.style.display == "none") {
			create_collection_name.value = null;
			create_collection_container.style.display = "block";
			create_collection_button.style.display = "none";
		} else {
			create_collection_container.style.display = "none";
			create_collection_button.style.display = "flex";
		}
	}

	create_collection_button.addEventListener("click", toggle_collection_creation);
	create_collection_cancel.addEventListener("click", toggle_collection_creation);


	// Create Collection
	const create_collection_name = post_save_modal.querySelector("#create-collection-name");
	const create_collection_submit = post_save_modal.querySelector("#create-collection-submit");

	function create_collection() {	
		fetch(`/collection/create`, {
			method: "POST",
			headers: {"Content-Type": "application/json"},
			body: JSON.stringify({"name": create_collection_name.value})
		}).then(response => {
			response.json().then(data => {
				if (data["status"] == "success") {
					let clone = post_save_modal.querySelector(".post-save-collection").cloneNode(true);

					clone.dataset.collectionId = data["collection_id"];
					clone.querySelector("input").checked = false;
					clone.querySelector("button").innerText = data["collection_name"];
					post_save_modal.querySelector("#post-save-collections").appendChild(clone);
					setup_collection(clone);
				} else if (data["status"] == "failure") {
					alert("Fatal Error: Please try again later");
				}
			});
		});

		toggle_collection_creation();
	}

	create_collection_submit.addEventListener("click", create_collection);


	// Setup Collection Posts
	const posts = document.querySelectorAll(".post-container");

	function setup_collection_post(post) {
		handle_collection_post_options(post);
		handle_collection_post_remove(post);
		handle_collection_post_save_read_later(post);
		handle_collection_post_save(post);
	}

	posts.forEach(post => {
		setup_collection_post(post);
	})
}


// Post
if (window.location.pathname.split("/").length == 3 && is_whole_number(window.location.pathname.split("/")[2])) {
	// Setup Recommended Posts
	const posts = document.querySelectorAll(".post-container");

	posts.forEach(post => {
		setup_post(post);
	});


	// Setup Post
	const post = document.querySelector("#post-container");
	setup_post_delete_confirmation(post);
	setup_user_follow(post);
	setup_post_like_dislike(post);


	// Delete Post Confirmation
	function setup_post_delete_confirmation(post) {
		const post_delete_button = post.querySelector("#post-delete-button")

		if (post_delete_button) {
			const post_delete_modal = document.querySelector("#post-delete-modal")
			const post_delete_modal_cancel_button = post_delete_modal.querySelector("#post-delete-modal-close-button")
			const post_delete_modal_submit_button = post_delete_modal.querySelector("#post-delete-modal-submit-button")

			function display_post_delete_modal() {
				post_delete_modal.style.display = "flex"
			}

			function hide_post_delete_modal() {
				post_delete_modal.style.display = "none"
			}

			function delete_post() {
				fetch(`${window.location.pathname}?action=delete`, {
					method: "POST"
				}).then(location.href = "/");
			}

			post_delete_button.addEventListener("click", display_post_delete_modal)
			post_delete_modal_cancel_button.addEventListener("click", hide_post_delete_modal)
			post_delete_modal_submit_button.addEventListener("click", delete_post)
		}
	}


	// Follow User from Post
	function setup_user_follow(post) {
		const post_follow_button = post.querySelector("#follow-button");
		const post_followers_count = post.querySelector("#post-followers-count");

		if (post_follow_button) {
			post_follow_button.addEventListener("click", () => {
				follow_user(post_follow_button, post_followers_count);
			});
		}
	}

	function follow_user(post_follow_button, post_followers_count) {
		fetch("/user/follow", {
			method: "POST",
			headers: {"Content-Type": "application/json"},
			body: JSON.stringify({"post_id": window.location.pathname.split('/')[2]})
		}).then(response => {
			response.json().then(data => {
				if (data["status"] == "success") {
					const following_status = data["following_status"];
					let follower_count_split = post_followers_count.innerText.split(" ");
					let follower_count = Number(follower_count_split[0]);

					if (following_status == true) {
						post_follow_button.innerText = "Following";
						post_follow_button.className = "following-button";
						follower_count_split[0] = follower_count + 1;
						post_followers_count.innerText = follower_count_split.join(" ");
					} else if (following_status == false) {
						post_follow_button.innerText = "Follow";
						post_follow_button.className = "follow-button";
						follower_count_split[0] = follower_count - 1;
						post_followers_count.innerText = follower_count_split.join(" ");
					}
				} else if (data["status"] == "failure") {
					alert("Fatal Error: Please try again later");
				}
			})
		})
	}


	// Post Like and Dislike
	function setup_post_like_dislike(post) {
		const post_like_button = document.querySelector("#post-like");
		const post_dislike_button = document.querySelector("#post-dislike");

		if (post_like_button && post_dislike_button) {
			post_like_button.addEventListener("click", () => {
				like_post("like", post_like_button, post_dislike_button);
			});

			post_dislike_button.addEventListener("click", () => {
				like_post("dislike", post_like_button, post_dislike_button);
			});
		}
	}

	function like_post(action, post_like_button, post_dislike_button) {
		fetch(`${window.location.pathname}?action=like`, {
			method: "POST",
			headers: {"Content-Type": "application/json"},
			body: JSON.stringify({"action": action})
		}).then(response => {
			response.json().then(data => {
				if (data["status"] == "success") {
					const previous_liked_status = data["previous_liked_status"];

					const post_like_button_count = post_like_button.querySelector("span");
					const post_dislike_button_count = post_dislike_button.querySelector("span");

					const like_count = Number(post_like_button_count.innerText);
					const dislike_count = Number(post_dislike_button_count.innerText);

					const post_like_button_img = post_like_button.querySelector("svg");
					const post_dislike_button_img = post_dislike_button.querySelector("svg");

					const new_like_svg = create_new_svg(24, 24, "0 0 24 24");
					const new_dislike_svg = create_new_svg(24, 24, "0 0 24 24");

					if (action == "like") {
						if (previous_liked_status == "liked") {
							new_like_svg.innerHTML = `<path fill="currentColor" d="M5 9v12H1V9h4m4 12a2 2 0 0 1-2-2V9c0-.55.22-1.05.59-1.41L14.17 1l1.06 1.06c.27.27.44.64.44 1.05l-.03.32L14.69 8H21a2 2 0 0 1 2 2v2c0 .26-.05.5-.14.73l-3.02 7.05C19.54 20.5 18.83 21 18 21H9m0-2h9.03L21 12v-2h-8.79l1.13-5.32L9 9.03V19Z"/>`;
							post_like_button.replaceChild(new_like_svg, post_like_button_img);
							post_like_button_count.innerText = `${like_count - 1}`;
						} else if (previous_liked_status == "disliked") {
							new_like_svg.innerHTML = `<path fill="currentColor" d="M23 10a2 2 0 0 0-2-2h-6.32l.96-4.57c.02-.1.03-.21.03-.32c0-.41-.17-.79-.44-1.06L14.17 1L7.59 7.58C7.22 7.95 7 8.45 7 9v10a2 2 0 0 0 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2M1 21h4V9H1v12Z"/>`;
							post_like_button.replaceChild(new_like_svg, post_like_button_img);
							post_like_button_count.innerText = `${like_count + 1}`;

							new_dislike_svg.innerHTML = `<path fill="currentColor" d="M19 15V3h4v12h-4M15 3a2 2 0 0 1 2 2v10c0 .55-.22 1.05-.59 1.41L9.83 23l-1.06-1.06c-.27-.27-.44-.64-.44-1.06l.03-.31l.95-4.57H3a2 2 0 0 1-2-2v-2c0-.26.05-.5.14-.73l3.02-7.05C4.46 3.5 5.17 3 6 3h9m0 2H5.97L3 12v2h8.78l-1.13 5.32L15 14.97V5Z"/>`;
							post_dislike_button.replaceChild(new_dislike_svg, post_dislike_button_img);
							post_dislike_button_count.innerText = `${dislike_count - 1}`;
						} else if (previous_liked_status == "undefined") {
							new_like_svg.innerHTML = `<path fill="currentColor" d="M23 10a2 2 0 0 0-2-2h-6.32l.96-4.57c.02-.1.03-.21.03-.32c0-.41-.17-.79-.44-1.06L14.17 1L7.59 7.58C7.22 7.95 7 8.45 7 9v10a2 2 0 0 0 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2M1 21h4V9H1v12Z"/>`;
							post_like_button.replaceChild(new_like_svg, post_like_button_img);
							post_like_button_count.innerText = `${like_count + 1}`;
						}
					} else if (action == "dislike") {
						if (previous_liked_status == "liked") {
							new_like_svg.innerHTML = `<path fill="currentColor" d="M5 9v12H1V9h4m4 12a2 2 0 0 1-2-2V9c0-.55.22-1.05.59-1.41L14.17 1l1.06 1.06c.27.27.44.64.44 1.05l-.03.32L14.69 8H21a2 2 0 0 1 2 2v2c0 .26-.05.5-.14.73l-3.02 7.05C19.54 20.5 18.83 21 18 21H9m0-2h9.03L21 12v-2h-8.79l1.13-5.32L9 9.03V19Z"/>`;
							post_like_button.replaceChild(new_like_svg, post_like_button_img);
							post_like_button_count.innerText = `${like_count - 1}`;

							new_dislike_svg.innerHTML = `<path fill="currentColor" d="M19 15h4V3h-4m-4 0H6c-.83 0-1.54.5-1.84 1.22l-3.02 7.05c-.09.23-.14.47-.14.73v2a2 2 0 0 0 2 2h6.31l-.95 4.57c-.02.1-.03.2-.03.31c0 .42.17.79.44 1.06L9.83 23l6.58-6.59c.37-.36.59-.86.59-1.41V5a2 2 0 0 0-2-2Z"/>`;
							post_dislike_button.replaceChild(new_dislike_svg, post_dislike_button_img);
							post_dislike_button_count.innerText = `${dislike_count + 1}`;
						} else if (previous_liked_status == "disliked") {
							new_dislike_svg.innerHTML = `<path fill="currentColor" d="M19 15V3h4v12h-4M15 3a2 2 0 0 1 2 2v10c0 .55-.22 1.05-.59 1.41L9.83 23l-1.06-1.06c-.27-.27-.44-.64-.44-1.06l.03-.31l.95-4.57H3a2 2 0 0 1-2-2v-2c0-.26.05-.5.14-.73l3.02-7.05C4.46 3.5 5.17 3 6 3h9m0 2H5.97L3 12v2h8.78l-1.13 5.32L15 14.97V5Z"/>`;
							post_dislike_button.replaceChild(new_dislike_svg, post_dislike_button_img);
							post_dislike_button_count.innerText = `${dislike_count - 1}`;
						} else if (previous_liked_status == "undefined") {
							new_dislike_svg.innerHTML = `<path fill="currentColor" d="M19 15h4V3h-4m-4 0H6c-.83 0-1.54.5-1.84 1.22l-3.02 7.05c-.09.23-.14.47-.14.73v2a2 2 0 0 0 2 2h6.31l-.95 4.57c-.02.1-.03.2-.03.31c0 .42.17.79.44 1.06L9.83 23l6.58-6.59c.37-.36.59-.86.59-1.41V5a2 2 0 0 0-2-2Z"/>`;
							post_dislike_button.replaceChild(new_dislike_svg, post_dislike_button_img);
							post_dislike_button_count.innerText = `${dislike_count + 1}`;
						}
					}
				} else if (data["status"] == "failure") {
					alert("Fatal Error: Please try again later");
				}
			})
		})
	}


	// Toggle Collection
	const post_collection_toggler = document.querySelector("#post-collection-toggle");
	const post_collection_body = document.querySelector("#post-collection-body");

	function post_collection_toggle() {
		if (post_collection_body.style.display == "block") {
			const angle_down = document.createElement("i");
			angle_down.setAttribute("class", "fa fa-angle-down");
			angle_down.setAttribute("aria-hidden", "true");
			angle_down.setAttribute("style", "font-size: 32px;")

			post_collection_toggler.innerText = "";
			post_collection_toggler.appendChild(angle_down);

			post_collection_body.style.display = "none";
		} else if (post_collection_body.style.display == "none") {
			post_collection_toggler.innerText = "✖"
			post_collection_body.style.display = "block";
		}
	}


	// Toggle Post Save
	const individual_post_save_modal = document.querySelector("#individual-post-save-modal");
	const post_save_opener = document.querySelector("#post-save-opener");
	const post_save_closer = individual_post_save_modal.querySelector("#individual-post-save-close");

	if (individual_post_save_modal) {
		post_save_opener.addEventListener("click", () => {
			toggle_element_visibility(individual_post_save_modal, "flex");
		});

		post_save_closer.addEventListener("click", () => {
			individual_post_save_modal.style.display = "none";
		})
	}






	// Setup Collections
	const collections = individual_post_save_modal.querySelectorAll(".post-save-collection");

	collections.forEach(collection => {
		setup_collection(collection);
	});


	function setup_collection(collection) {
		const collection_id = collection.dataset.collectionId;
		const checkbox = collection.querySelector("input");
		const button = collection.querySelector("button");

		checkbox.addEventListener("change", () => {
			update_post_to_collection(collection_id, checkbox);
		});

		button.addEventListener("click", () => {
			update_post_to_collection(collection_id, checkbox);
		});
	}

	function update_post_to_collection(collection_id, checkbox) {
		const post_id = window.location.pathname.split('/')[2];
		collection_id = Number(collection_id);

		fetch(`/collection/edit?list=${collection_id}&action=update`, {
			method: "POST",
			headers: {"Content-Type": "application/json"},
			body: JSON.stringify({"post_id": post_id})
		}).then(response => {
			response.json().then(data => {
				if (data["status"] == "success") {
					if (data["in_collection"]) {
						checkbox.checked = true;
					} else {
						checkbox.checked = false;
					}

				} else if (data["status"] == "failure") {
					alert("Fatal Error: Please try again later");
				}
			});
		});
	}


	// Create Collection Toggle
	const create_collection_container = individual_post_save_modal.querySelector("#individual-create-collection-container");

	const create_collection_button = individual_post_save_modal.querySelector("#individual-post-save-create-new");
	const create_collection_cancel = individual_post_save_modal.querySelector("#individual-create-collection-cancel");

	function toggle_collection_creation() {
		if (create_collection_container.style.display == "none") {
			create_collection_name.value = null;
			create_collection_container.style.display = "block";
			create_collection_button.style.display = "none";
		} else {
			create_collection_container.style.display = "none";
			create_collection_button.style.display = "flex";
		}
	}

	create_collection_button.addEventListener("click", toggle_collection_creation);
	create_collection_cancel.addEventListener("click", toggle_collection_creation);


	// Create Collection
	const create_collection_name = individual_post_save_modal.querySelector("#individual-create-collection-name");
	const create_collection_submit = individual_post_save_modal.querySelector("#individual-create-collection-submit");

	function create_collection() {	
		fetch(`/collection/create`, {
			method: "POST",
			headers: {"Content-Type": "application/json"},
			body: JSON.stringify({"name": create_collection_name.value})
		}).then(response => {
			response.json().then(data => {
				if (data["status"] == "success") {
					let clone = individual_post_save_modal.querySelector(".post-save-collection").cloneNode(true);

					clone.dataset.collectionId = data["collection_id"];
					clone.querySelector("input").checked = false;
					clone.querySelector("button").innerText = data["collection_name"];
					individual_post_save_modal.querySelector("#individual-post-save-collections").appendChild(clone);
					setup_collection(clone);
				} else if (data["status"] == "failure") {
					alert("Fatal Error: Please try again later");
				}
			});
		});

		toggle_collection_creation();
	}

	create_collection_submit.addEventListener("click", create_collection);





	// Toggle Comment Sort
	const sort_comments_button = document.querySelector("#sort-comments-button");
	const sort_comments_options = document.querySelector("#sort-comments-options");

	function toggle_sort_comments_options(e) {
		e.stopPropagation();

		toggle_element_visibility(sort_comments_options, "flex");
	}

	function hide_sort_comments_options() {
		sort_comments_options.style.display = "none";
	}

	sort_comments_button.addEventListener("click", toggle_sort_comments_options);

	document.addEventListener("click", e => {
		if (sort_comments_options.style.display == "flex") {
			hide_sort_comments_options();
		}
	});


	// Show Post Comment Options
	const comment_create = document.querySelector("#comment-create");
	const comment_create_input = comment_create.querySelector(".comment-input");

	const comment_create_options = comment_create.querySelector("#comment-create-options");
	const comment_create_cancel_button = comment_create.querySelector("#comment-create-cancel-button");

	function show_comment_create_options() {
		comment_create_options.style.display = "flex";
	}

	function hide_comment_create_options() {
		comment_create_options.style.display = "none";
	}

	comment_create_input.addEventListener("focus", show_comment_create_options);
	comment_create_input.addEventListener("input", auto_resize_comment_input);
	comment_create_cancel_button.addEventListener("click", hide_comment_create_options);


	// Setup Comments
	const comments = document.querySelectorAll(".comment");

	comments.forEach(comment => {
		setup_comment_replies(comment);
		setup_create_comment_reply(comment);
		setup_comment_like_dislike(comment);
	});


	/* Infinite Load Comments
	const comments_container = document.querySelector("#comment-section")
	const fake_comment = document.querySelector("#fake-comment")
	const comment_template = document.querySelector("#comment-template")


	let comments_counter = 0

	function load_comments() {
		fetch(`/load_home?c=${comments_counter}`).then(response => {
			response.json().then(data => {
				if (!data.length) {
					fake_comment.remove()
				}

				for (var i = 0; i < data.length; i++) {
					let template_clone = comment_template.content.cloneNode(true)

					template_clone.querySelector(".post-user-img").setAttribute("src", `/static/images/profile_pics/${data[i]["image_file"]}`)

					template_clone.querySelector(".post-header > a").setAttribute("href", `/user/${data[i]["author"]}`)
					template_clone.querySelector(".post-header > a").innerText = data[i]["author"]

					template_clone.querySelector(".post-title > a").setAttribute("href", `/post/${parseInt(data[i]["id"])}`)
					template_clone.querySelector(".post-title > a").innerText = data[i]["title"]
					template_clone.querySelector(".post-title").innerHTML += data[i]["date_posted"]

					template_clone.querySelector(".post-content").innerText = data[i]["content"]

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


	// Comment Replies
	function setup_comment_replies(comment) {
		const comment_replies_container = comment.querySelector(".comment-replies-container");

		if (comment_replies_container) {
			const comment_view_replies_button = comment.querySelector(".comment-view-reply-button")

			function toggle_comment_replies() {
				const comment_view_replies_img = comment_view_replies_button.querySelector("svg");
				const new_comment_view_replies_img = create_new_svg(24, 24, "0 0 24 24");

				if (comment_replies_container.style.display === "none") {
					comment_replies_container.style.display = "block";

					new_comment_view_replies_img.innerHTML = `<path fill="currentColor" d="m17 13.41l-4.29-4.24a1 1 0 0 0-1.42 0l-4.24 4.24a1 1 0 0 0 0 1.42a1 1 0 0 0 1.41 0L12 11.29l3.54 3.54a1 1 0 0 0 .7.29a1 1 0 0 0 .71-.29a1 1 0 0 0 .05-1.42Z"/>`;
					comment_view_replies_button.replaceChild(new_comment_view_replies_img, comment_view_replies_img);
				} else if (comment_replies_container.style.display === "block") {
					comment_replies_container.style.display = "none";

					new_comment_view_replies_img.innerHTML = `<path fill="currentColor" d="M12 15.121a.997.997 0 0 1-.707-.293L7.05 10.586a1 1 0 0 1 1.414-1.414L12 12.707l3.536-3.535a1 1 0 0 1 1.414 1.414l-4.243 4.242a.997.997 0 0 1-.707.293Z"/>`;
					comment_view_replies_button.replaceChild(new_comment_view_replies_img, comment_view_replies_img);
				}
			}

			comment_view_replies_button.addEventListener("click", toggle_comment_replies);


			// Setup All of the Comment's Replies
			const comment_replies = comment_replies_container.querySelectorAll(".comment-reply");

			comment_replies.forEach(comment_reply => {
				setup_create_comment_reply_reply(comment_reply);
				setup_comment_like_dislike(comment_reply);
			})
		}
	}


	// Create Comment Replies
	// Update the amount of comments with a function because after posting comment there will be one more
	function setup_create_comment_reply(comment) {
		const comment_reply_button = comment.querySelector(".comment-reply-button");
		const comment_create = comment.querySelector(".comment-create");
		const comment_reply_cancel_button = comment.querySelector(".comment-reply-cancel-button");
		const comment_reply_input = comment_create.querySelector(".comment-input");

		comment_reply_input.addEventListener("input", auto_resize_comment_input);

		comment_reply_button.addEventListener("click", () => {
			comment_create.style.display = "flex";
			comment_reply_input.focus();
		})

		comment_reply_cancel_button.addEventListener("click", () => {
			comment_create.style.display = "none";
		})
	}

	function auto_resize_comment_input() {
		this.style.height = "24px";
		this.style.height = this.scrollHeight + "px";
	}

	function setup_create_comment_reply_reply(comment) {
		const comment_reply_button = comment.querySelector(".comment-reply-button");
		const comment_reply_parent_comment = comment.parentElement.parentElement.parentElement
		const comment_create = comment_reply_parent_comment.querySelector(".comment-create");
		const comment_reply_input = comment_create.querySelector(".comment-input");
		const comment_reply_cancel_button = comment_reply_parent_comment.querySelector(".comment-reply-cancel-button");

		const comment_reply_user_username = comment.dataset.username;

		comment_reply_button.addEventListener("click", () => {
			comment_reply_input.value = `@${comment_reply_user_username} `;
			comment_create.style.display = "flex";
			comment_reply_input.focus();
		})

		comment_reply_cancel_button.addEventListener("click", () => {
			comment_create.style.display = "none";
			comment_reply_input.value = "";
		})
	}


	// Comment like and dislike
	function setup_comment_like_dislike(comment) {
		const comment_id = comment.dataset.id;
		const comment_like_button = comment.querySelector(".comment-like");
		const comment_dislike_button = comment.querySelector(".comment-dislike");

		comment_like_button.addEventListener("click", () => {
			like_dislike_comment("like", comment_id, comment_like_button, comment_dislike_button);
		})

		comment_dislike_button.addEventListener("click", () => {
			like_dislike_comment("dislike", comment_id, comment_like_button, comment_dislike_button);
		})
	}

	function like_dislike_comment(action, comment_id, like_button, dislike_button) {
		fetch(`${window.location.pathname}?action=like`, {
			method: "POST",
			headers: {"Content-Type": "application/json"},
			body: JSON.stringify({"comment_id": comment_id, "action": action})
		}).then(response => {
			response.json().then(data => {
				if (data["status"] == "success") {
					const previous_liked_status = data["previous_liked_status"];

					const comment_like_button_count = like_button.querySelector("span");
					const comment_dislike_button_count = dislike_button.querySelector("span");

					const like_count = Number(comment_like_button_count.innerText);
					const dislike_count = Number(comment_dislike_button_count.innerText);

					const comment_like_button_img = like_button.querySelector("svg");
					const comment_dislike_button_img = dislike_button.querySelector("svg");

					const new_like_svg = create_new_svg(18, 18, "0 0 24 24");
					const new_dislike_svg = create_new_svg(18, 18, "0 0 24 24");

					if (action == "like") {
						if (previous_liked_status == "liked") {
							new_like_svg.innerHTML = `<path fill="currentColor" d="M5 9v12H1V9h4m4 12a2 2 0 0 1-2-2V9c0-.55.22-1.05.59-1.41L14.17 1l1.06 1.06c.27.27.44.64.44 1.05l-.03.32L14.69 8H21a2 2 0 0 1 2 2v2c0 .26-.05.5-.14.73l-3.02 7.05C19.54 20.5 18.83 21 18 21H9m0-2h9.03L21 12v-2h-8.79l1.13-5.32L9 9.03V19Z"/>`;
							like_button.replaceChild(new_like_svg, comment_like_button_img);
							comment_like_button_count.innerText = `${like_count - 1}`;
						} else if (previous_liked_status == "disliked") {
							new_like_svg.innerHTML = `<path fill="currentColor" d="M23 10a2 2 0 0 0-2-2h-6.32l.96-4.57c.02-.1.03-.21.03-.32c0-.41-.17-.79-.44-1.06L14.17 1L7.59 7.58C7.22 7.95 7 8.45 7 9v10a2 2 0 0 0 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2M1 21h4V9H1v12Z"/>`;
							like_button.replaceChild(new_like_svg, comment_like_button_img);
							comment_like_button_count.innerText = `${like_count + 1}`;

							new_dislike_svg.innerHTML = `<path fill="currentColor" d="M19 15V3h4v12h-4M15 3a2 2 0 0 1 2 2v10c0 .55-.22 1.05-.59 1.41L9.83 23l-1.06-1.06c-.27-.27-.44-.64-.44-1.06l.03-.31l.95-4.57H3a2 2 0 0 1-2-2v-2c0-.26.05-.5.14-.73l3.02-7.05C4.46 3.5 5.17 3 6 3h9m0 2H5.97L3 12v2h8.78l-1.13 5.32L15 14.97V5Z"/>`;
							dislike_button.replaceChild(new_dislike_svg, comment_dislike_button_img);
							comment_dislike_button_count.innerText = `${dislike_count - 1}`;
						} else if (previous_liked_status == "undefined") {
							new_like_svg.innerHTML = `<path fill="currentColor" d="M23 10a2 2 0 0 0-2-2h-6.32l.96-4.57c.02-.1.03-.21.03-.32c0-.41-.17-.79-.44-1.06L14.17 1L7.59 7.58C7.22 7.95 7 8.45 7 9v10a2 2 0 0 0 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2M1 21h4V9H1v12Z"/>`;
							like_button.replaceChild(new_like_svg, comment_like_button_img);
							comment_like_button_count.innerText = `${like_count + 1}`;
						}
					} else if (action == "dislike") {
						if (previous_liked_status == "liked") {
							new_like_svg.innerHTML = `<path fill="currentColor" d="M5 9v12H1V9h4m4 12a2 2 0 0 1-2-2V9c0-.55.22-1.05.59-1.41L14.17 1l1.06 1.06c.27.27.44.64.44 1.05l-.03.32L14.69 8H21a2 2 0 0 1 2 2v2c0 .26-.05.5-.14.73l-3.02 7.05C19.54 20.5 18.83 21 18 21H9m0-2h9.03L21 12v-2h-8.79l1.13-5.32L9 9.03V19Z"/>`;
							like_button.replaceChild(new_like_svg, comment_like_button_img);
							comment_like_button_count.innerText = `${like_count - 1}`;

							new_dislike_svg.innerHTML = `<path fill="currentColor" d="M19 15h4V3h-4m-4 0H6c-.83 0-1.54.5-1.84 1.22l-3.02 7.05c-.09.23-.14.47-.14.73v2a2 2 0 0 0 2 2h6.31l-.95 4.57c-.02.1-.03.2-.03.31c0 .42.17.79.44 1.06L9.83 23l6.58-6.59c.37-.36.59-.86.59-1.41V5a2 2 0 0 0-2-2Z"/>`;
							dislike_button.replaceChild(new_dislike_svg, comment_dislike_button_img);
							comment_dislike_button_count.innerText = `${dislike_count + 1}`;
						} else if (previous_liked_status == "disliked") {
							new_dislike_svg.innerHTML = `<path fill="currentColor" d="M19 15V3h4v12h-4M15 3a2 2 0 0 1 2 2v10c0 .55-.22 1.05-.59 1.41L9.83 23l-1.06-1.06c-.27-.27-.44-.64-.44-1.06l.03-.31l.95-4.57H3a2 2 0 0 1-2-2v-2c0-.26.05-.5.14-.73l3.02-7.05C4.46 3.5 5.17 3 6 3h9m0 2H5.97L3 12v2h8.78l-1.13 5.32L15 14.97V5Z"/>`;
							dislike_button.replaceChild(new_dislike_svg, comment_dislike_button_img);
							comment_dislike_button_count.innerText = `${dislike_count - 1}`;
						} else if (previous_liked_status == "undefined") {
							new_dislike_svg.innerHTML = `<path fill="currentColor" d="M19 15h4V3h-4m-4 0H6c-.83 0-1.54.5-1.84 1.22l-3.02 7.05c-.09.23-.14.47-.14.73v2a2 2 0 0 0 2 2h6.31l-.95 4.57c-.02.1-.03.2-.03.31c0 .42.17.79.44 1.06L9.83 23l6.58-6.59c.37-.36.59-.86.59-1.41V5a2 2 0 0 0-2-2Z"/>`;
							dislike_button.replaceChild(new_dislike_svg, comment_dislike_button_img);
							comment_dislike_button_count.innerText = `${dislike_count + 1}`;
						}
					}
				} else if (data["status"] == "failure") {
					alert("Fatal Error: Please try again later");
				}
			})
		})
	}
}


// New Post
if (window.location.pathname.split("/").length == 3 && window.location.pathname.split("/")[2] == "new") {
	// Save and Return to Post Caches
	const save_and_return_post_caches_button = document.querySelector("#save-and-return-post-caches-button");

	save_and_return_post_caches_button.addEventListener("click", () => {
		save_post();
		redirect("/post/caches");
	})


	// Insert Media Menu
	const insert_media_button = document.querySelector("#create-post-insert-button");
	const insert_media_menu = document.querySelector("#create-post-insert-menu");

	function hide_insert_media_menu() {
		insert_media_menu.style.display = "none";
	}

	insert_media_button.addEventListener("click", e => {
		e.stopPropagation();

		toggle_element_visibility(insert_media_menu, "flex");
	});

	document.addEventListener("click", e => {
		if (insert_media_menu.style.display == "flex") {
			if (!e.target.closest("#create-post-insert-menu")) {
				hide_insert_media_menu();
			}
		}
	})


	// Upload Media
	const import_file = document.querySelector("#import-file");
	const import_file_button = document.querySelector("#import-file-button");

	function show_insert_media_input() {
		import_file.click();
		toggle_element_visibility(insert_media_menu, "flex");
	}

	import_file_button.addEventListener("click", show_insert_media_input);


	// Uploads Media Automatically after file input
	const create_post_form = document.querySelector("#create-post-form");

	import_file.addEventListener("change", () => {
		create_post_form.requestSubmit();
	})


	// Setup Uploaded Media
	const uploaded_media_containers = document.querySelectorAll(".uploaded-media-container");

	uploaded_media_containers.forEach(uploaded_media_container => {
		setup_uploaded_media_insert(uploaded_media_container);
		setup_uploaded_media_options(uploaded_media_container);
		setup_uploaded_media_delete(uploaded_media_container);
	});


	// Select Media to insert and then submit
	const hidden_file_input = document.querySelector("#file");

	function setup_uploaded_media_insert(uploaded_media_container) {
		const uploaded_media = uploaded_media_container.querySelector(".uploaded-media");

		uploaded_media.addEventListener("click", () => {
			insert_media(uploaded_media);
		});
	}

	function insert_media(uploaded_media) {
		const media_source = uploaded_media.getAttribute("src");

		hidden_file_input.setAttribute("value", media_source.replace("/static/", ""));
		create_post_form.requestSubmit();
	}


	// Hover over imported media for more options
	let uploaded_media_options_active = null;
	let uploaded_media_options_opener_active = null;

	function setup_uploaded_media_options(uploaded_media_container) {
		const uploaded_media_options_opener = uploaded_media_container.querySelector(".uploaded-media-options-opener");
		const uploaded_media_options = uploaded_media_container.querySelector(".uploaded-media-options");

		uploaded_media_container.addEventListener("mouseover", () => {
			uploaded_media_options_opener.style.display = "flex";
		});

		uploaded_media_container.addEventListener("mouseleave", () => {
			if (uploaded_media_options_active != uploaded_media_options) {
				uploaded_media_options_opener.style.display = "none";
			}
		});

		uploaded_media_options_opener.addEventListener("click", () => {
			if (uploaded_media_options.style.display == "flex") {
				uploaded_media_options_active = null;
				uploaded_media_options.style.display = "none";
			} else if (uploaded_media_options.style.display == "none") {
				if (uploaded_media_options_active) {
					uploaded_media_options_active.style.display = "none";
					uploaded_media_options_opener_active.style.display = "none";
				}

				uploaded_media_options_active = uploaded_media_options;
				uploaded_media_options_opener_active = uploaded_media_options_opener;
				uploaded_media_options.style.display = "flex";
			}
		});
	}


	// Uploaded Media Delete
	function setup_uploaded_media_delete(uploaded_media_container) {
		const button = uploaded_media_container.querySelector(".uploaded-media-remove");
		const media_id = uploaded_media_container.querySelector(".uploaded-media").dataset.id;

		button.addEventListener("click", () => {
			uploaded_media_remove(uploaded_media_container, media_id);
		});
	}

	function uploaded_media_remove(uploaded_media_container, media_id) {
		fetch("/post/delete_media", {
			method: "POST",
			headers:{"Content-Type": "application/json"},
			body: JSON.stringify({"media_id": media_id})
		}).then(response => {
			response.json().then(data => {
				if (data == "success") {
					uploaded_media_container.remove();
				} else if (data == "failure") {
					alert("Fatal Error: Please try again later");
				}
			})
		})
	}


	// Setup Inserted Media
	const inserted_media_containers = document.querySelectorAll(".inserted-media-container");

	inserted_media_containers.forEach(inserted_media_container => {
		setup_inserted_media_options(inserted_media_container);
		setup_inserted_media_size(inserted_media_container);
		setup_inserted_media_remove(inserted_media_container);
	});


	// Hover over inserted media for more options
	let inserted_media_options_active = null;
	let inserted_media_options_opener_active = null;

	function setup_inserted_media_options(inserted_media_container) {
		const inserted_media_options_opener = inserted_media_container.querySelector(".inserted-media-options-opener");
		const inserted_media_options = inserted_media_container.querySelector(".inserted-media-options");

		inserted_media_container.addEventListener("mouseover", () => {
			inserted_media_options_opener.style.display = "flex";
		});

		inserted_media_container.addEventListener("mouseleave", () => {
			if (inserted_media_options_active != inserted_media_options) {
				inserted_media_options_opener.style.display = "none";
			}
		});

		inserted_media_options_opener.addEventListener("click", () => {
			if (inserted_media_options.style.display == "flex") {
				inserted_media_options_active = null;
				inserted_media_options.style.display = "none";
			} else if (inserted_media_options.style.display == "none") {
				if (inserted_media_options_active) {
					inserted_media_options_active.style.display = "none";
					inserted_media_options_opener_active.style.display = "none";
				}

				inserted_media_options_active = inserted_media_options;
				inserted_media_options_opener_active = inserted_media_options_opener;
				inserted_media_options.style.display = "flex";
			}
		});
	}


	// Change Size of Inserted Media
	function setup_inserted_media_size(inserted_media_container) {
		const inserted_media_image = inserted_media_container.querySelector(".inserted-media");
		const inserted_media_size_input = inserted_media_container.querySelector(".inserted-media-size-input");
		const inserted_media_size = inserted_media_container.querySelector(".inserted-media-size");

		inserted_media_size_input.addEventListener("input", () => {
			inserted_media_size.value = inserted_media_size_input.value + "%";
			inserted_media_image.style.width = inserted_media_size_input.value + "%";
		})
	}


	// Remove Inserted Media
	function setup_inserted_media_remove(inserted_media_container) {
		const remove_button = inserted_media_container.querySelector(".inserted-media-remove");

		remove_button.addEventListener("click", () => {
			inserted_media_container.remove();
			save_post();
		});
	}


	// Setup Inserted Textboxes
	const textarea_containers = document.querySelectorAll(".textarea-container");

	textarea_containers.forEach(textarea_container => {
		setup_textarea_options(textarea_container);
		setup_inserted_textarea_remove(textarea_container);
	});


	// Hover over inserted textarea for more options
	let textarea_options_active = null;
	let textarea_options_opener_active = null;

	function setup_textarea_options(textarea_container) {
		const textarea_options_opener = textarea_container.querySelector(".textarea-options-opener");
		const textarea_options = textarea_container.querySelector(".textarea-options");

		textarea_container.addEventListener("mouseover", () => {
			textarea_options_opener.style.display = "flex";
		});

		textarea_container.addEventListener("mouseleave", () => {
			if (textarea_options_active != textarea_options) {
				textarea_options_opener.style.display = "none";
			}
		});

		textarea_options_opener.addEventListener("click", () => {
			if (textarea_options.style.display == "flex") {
				textarea_options_active = null;
				textarea_options.style.display = "none";
			} else if (textarea_options.style.display == "none") {
				if (textarea_options_active) {
					textarea_options_active.style.display = "none";
					textarea_options_opener_active.style.display = "none";
				}

				textarea_options_active = textarea_options;
				textarea_options_opener_active = textarea_options_opener;
				textarea_options.style.display = "flex";
			}
		});
	}


	// Remove Inserted Textarea
	function setup_inserted_textarea_remove(textarea_container) {
		const remove_button = textarea_container.querySelector(".textarea-remove");

		remove_button.addEventListener("click", () => {
			textarea_container.remove();
			save_post();
		});
	}


	// Take Post Overview (For Saving)
	const input_elements_id_not_allowed = ["file", "csrf_token", "import-file", "new-post-submit-button"]

	function take_post_overview() {
		const input_elements = create_post_form.querySelectorAll("input, textarea")
		let filtered_input_elements = {}

		input_elements.forEach(element => {
			if (!(input_elements_id_not_allowed.includes(element.getAttribute("id")))) {
				filtered_input_elements[element.getAttribute("name")] = element.getAttribute("value") || element.value;
			}
		})

		return JSON.stringify(filtered_input_elements);
	}


	// Save Post
	let post_overview = take_post_overview();

	function save_post() {
		if (post_overview != take_post_overview()) {
			post_overview = take_post_overview();

			fetch(`/post/save?post_cache_id=${location.href.split("=")[1]}`, {
				method: "POST",
				headers:{"Content-Type": "application/json"},
				body: post_overview
			}).then(response => {
				response.json().then(data => {
					if (data == "failure") {
						alert("Fatal Error: Post wasn't saved");
					}
				})
			})
		}
	}


	// Autosave Post
	let time_before_save = 3

	function autosave_post() {
		time_before_save -= 1;

		if (time_before_save == 0) {
			save_post();
			time_before_save = 3;
		}
	}

	window.addEventListener("keydown", e => {
		// While the user is typing, reset so the post doesn't save too much
		time_before_save = 3;
	});

	setInterval(autosave_post, 1000);
}


// Update Post
if (window.location.pathname.split("/").length == 4 && window.location.pathname.split("/")[3] == "update") {
	// Add warning before leaving page
	let unsafe_to_leave = true;

	const update_post_submit_button = document.querySelector("#update-post-submit-button");
	update_post_submit_button.addEventListener("click", () => {
		unsafe_to_leave = false;
	});

	window.addEventListener("beforeunload", event => {
		if (unsafe_to_leave === true) {
			fetch(`${window.location.pathname}?action=delete`, {method: "POST"});

			event.preventDefault();
			event.returnValue = "";
		}
	})


	// Insert Media Menu
	const insert_media_button = document.querySelector("#create-post-insert-button");
	const insert_media_menu = document.querySelector("#create-post-insert-menu");

	function hide_insert_media_menu() {
		insert_media_menu.style.display = "none";
	}

	insert_media_button.addEventListener("click", e => {
		e.stopPropagation();

		toggle_element_visibility(insert_media_menu, "flex");
	});

	document.addEventListener("click", e => {
		if (insert_media_menu.style.display == "flex") {
			if (!e.target.closest("#create-post-insert-menu")) {
				hide_insert_media_menu();
			}
		}
	});


	// Upload Media
	const import_file = document.querySelector("#import-file");
	const import_file_button = document.querySelector("#import-file-button");

	function show_insert_media_input() {
		import_file.click();
		toggle_element_visibility(insert_media_menu, "flex");
	}

	import_file_button.addEventListener("click", show_insert_media_input);


	// Uploads Media Automatically after file input
	const create_post_form = document.querySelector("#create-post-form");

	import_file.addEventListener("change", () => {
		unsafe_to_leave = false;
		create_post_form.requestSubmit();
	})


	// Setup Uploaded Media
	const uploaded_media_containers = document.querySelectorAll(".uploaded-media-container");

	uploaded_media_containers.forEach(uploaded_media_container => {
		setup_uploaded_media_insert(uploaded_media_container);
		setup_uploaded_media_options(uploaded_media_container);
		setup_uploaded_media_delete(uploaded_media_container);
	});


	// Select Media to insert and then submit
	const hidden_file_input = document.querySelector("#file");

	function setup_uploaded_media_insert(uploaded_media_container) {
		const uploaded_media = uploaded_media_container.querySelector(".uploaded-media");

		uploaded_media.addEventListener("click", () => {
			unsafe_to_leave = false;
			insert_media(uploaded_media);
		});
	}

	function insert_media(uploaded_media) {
		const media_source = uploaded_media.getAttribute("src");

		hidden_file_input.setAttribute("value", media_source.replace("/static/", ""));
		create_post_form.requestSubmit();
	}


	// Hover over imported media for more options
	let uploaded_media_options_active = null;
	let uploaded_media_options_opener_active = null;

	function setup_uploaded_media_options(uploaded_media_container) {
		const uploaded_media_options_opener = uploaded_media_container.querySelector(".uploaded-media-options-opener");
		const uploaded_media_options = uploaded_media_container.querySelector(".uploaded-media-options");

		uploaded_media_container.addEventListener("mouseover", () => {
			uploaded_media_options_opener.style.display = "flex";
		});

		uploaded_media_container.addEventListener("mouseleave", () => {
			if (uploaded_media_options_active != uploaded_media_options) {
				uploaded_media_options_opener.style.display = "none";
			}
		});

		uploaded_media_options_opener.addEventListener("click", () => {
			if (uploaded_media_options.style.display == "flex") {
				uploaded_media_options_active = null;
				uploaded_media_options.style.display = "none";
			} else if (uploaded_media_options.style.display == "none") {
				if (uploaded_media_options_active) {
					uploaded_media_options_active.style.display = "none";
					uploaded_media_options_opener_active.style.display = "none";
				}

				uploaded_media_options_active = uploaded_media_options;
				uploaded_media_options_opener_active = uploaded_media_options_opener;
				uploaded_media_options.style.display = "flex";
			}
		});
	}


	// Uploaded Media Delete
	function setup_uploaded_media_delete(uploaded_media_container) {
		const button = uploaded_media_container.querySelector(".uploaded-media-remove");
		const media_id = uploaded_media_container.querySelector(".uploaded-media").dataset.id;

		button.addEventListener("click", () => {
			uploaded_media_remove(uploaded_media_container, media_id);
		});
	}

	function uploaded_media_remove(uploaded_media_container, media_id) {
		fetch("/post/delete_media", {
			method: "POST",
			headers:{"Content-Type": "application/json"},
			body: JSON.stringify({"media_id": media_id})
		}).then(response => {
			response.json().then(data => {
				if (data == "success") {
					uploaded_media_container.remove();
				} else if (data == "failure") {
					alert("Fatal Error: Please try again later");
				}
			})
		})
	}


	// Setup Inserted Media
	const inserted_media_containers = document.querySelectorAll(".inserted-media-container");

	inserted_media_containers.forEach(inserted_media_container => {
		setup_inserted_media_options(inserted_media_container);
		setup_inserted_media_size(inserted_media_container);
		setup_inserted_media_remove(inserted_media_container);
	});


	// Hover over inserted media for more options
	let inserted_media_options_active = null;
	let inserted_media_options_opener_active = null;

	function setup_inserted_media_options(inserted_media_container) {
		const inserted_media_options_opener = inserted_media_container.querySelector(".inserted-media-options-opener");
		const inserted_media_options = inserted_media_container.querySelector(".inserted-media-options");

		inserted_media_container.addEventListener("mouseover", () => {
			inserted_media_options_opener.style.display = "flex";
		});

		inserted_media_container.addEventListener("mouseleave", () => {
			if (inserted_media_options_active != inserted_media_options) {
				inserted_media_options_opener.style.display = "none";
			}
		});

		inserted_media_options_opener.addEventListener("click", () => {
			if (inserted_media_options.style.display == "flex") {
				inserted_media_options_active = null;
				inserted_media_options.style.display = "none";
			} else if (inserted_media_options.style.display == "none") {
				if (inserted_media_options_active) {
					inserted_media_options_active.style.display = "none";
					inserted_media_options_opener_active.style.display = "none";
				}

				inserted_media_options_active = inserted_media_options;
				inserted_media_options_opener_active = inserted_media_options_opener;
				inserted_media_options.style.display = "flex";
			}
		});
	}


	// Change Size of Inserted Media
	function setup_inserted_media_size(inserted_media_container) {
		const inserted_media_image = inserted_media_container.querySelector(".inserted-media");
		const inserted_media_size_input = inserted_media_container.querySelector(".inserted-media-size-input");
		const inserted_media_size = inserted_media_container.querySelector(".inserted-media-size");

		inserted_media_size_input.addEventListener("input", () => {
			inserted_media_size.value = inserted_media_size_input.value + "%";
			inserted_media_image.style.width = inserted_media_size_input.value + "%";
		})
	}


	// Remove Inserted Media
	function setup_inserted_media_remove(inserted_media_container) {
		const remove_button = inserted_media_container.querySelector(".inserted-media-remove");

		remove_button.addEventListener("click", () => {
			inserted_media_container.remove();
			save_post();
		});
	}


	// Setup Inserted Textboxes
	const textarea_containers = document.querySelectorAll(".textarea-container");

	textarea_containers.forEach(textarea_container => {
		setup_textarea_options(textarea_container);
		setup_inserted_textarea_remove(textarea_container);
	});


	// Hover over inserted textarea for more options
	let textarea_options_active = null;
	let textarea_options_opener_active = null;

	function setup_textarea_options(textarea_container) {
		const textarea_options_opener = textarea_container.querySelector(".textarea-options-opener");
		const textarea_options = textarea_container.querySelector(".textarea-options");

		textarea_container.addEventListener("mouseover", () => {
			textarea_options_opener.style.display = "flex";
		});

		textarea_container.addEventListener("mouseleave", () => {
			if (textarea_options_active != textarea_options) {
				textarea_options_opener.style.display = "none";
			}
		});

		textarea_options_opener.addEventListener("click", () => {
			if (textarea_options.style.display == "flex") {
				textarea_options_active = null;
				textarea_options.style.display = "none";
			} else if (textarea_options.style.display == "none") {
				if (textarea_options_active) {
					textarea_options_active.style.display = "none";
					textarea_options_opener_active.style.display = "none";
				}

				textarea_options_active = textarea_options;
				textarea_options_opener_active = textarea_options_opener;
				textarea_options.style.display = "flex";
			}
		});
	}


	// Remove Inserted Textarea
	function setup_inserted_textarea_remove(textarea_container) {
		const remove_button = textarea_container.querySelector(".textarea-remove");

		remove_button.addEventListener("click", () => {
			textarea_container.remove();
			save_post();
		});
	}
}


// Post Caches
if (window.location.pathname.split("/").length == 3 && window.location.pathname.split("/")[2] == "caches") {
	// Setup Post Caches
	const post_caches = document.querySelectorAll(".post-cache");

	function setup_post_cache(post_cache) {
		setup_post_cache_hover(post_cache);
		setup_post_cache_options_toggle(post_cache);
		setup_delete_post_cache(post_cache);
	}

	post_caches.forEach(post_cache => {
		setup_post_cache(post_cache);
	})


	// Hover over post cache for more options
	let post_cache_dropdown_opener_active = null;
	let post_cache_dropdown_active = null;

	function setup_post_cache_hover(post_cache) {
		const post_cache_dropdown_opener = post_cache.querySelector(".post-cache-dropdown-opener");
		const post_cache_dropdown = post_cache.querySelector(".post-cache-dropdown");

		post_cache.addEventListener("mouseover", () => {
			display_post_cache_options(post_cache_dropdown_opener);
		});

		post_cache.addEventListener("mouseleave", () => {
			hide_post_cache_options(post_cache_dropdown_opener, post_cache_dropdown);
		});
	}

	function display_post_cache_options(post_cache_dropdown_opener) {
		post_cache_dropdown_opener.style.display = "flex";
	}

	function hide_post_cache_options(post_cache_dropdown_opener, post_cache_dropdown) {
		if (post_cache_dropdown_active != post_cache_dropdown) {
			post_cache_dropdown_opener.style.display = "none";
		}
	}


	// Toggle Options
	function setup_post_cache_options_toggle(post_cache) {
		const post_cache_dropdown_opener = post_cache.querySelector(".post-cache-dropdown-opener");
		const post_cache_dropdown = post_cache.querySelector(".post-cache-dropdown");

		post_cache_dropdown_opener.addEventListener("click", e => {
			e.stopPropagation();

			if (post_cache_dropdown.style.display === "flex") {
				post_cache_dropdown_active = null;
				post_cache_dropdown.style.display = "none";
			} else if (post_cache_dropdown.style.display === "none") {
				if (post_cache_dropdown_active) {
					post_cache_dropdown_opener_active.style.display = "none";
					post_cache_dropdown_active.style.display = "none";
				}

				post_cache_dropdown_opener_active = post_cache_dropdown_opener;
				post_cache_dropdown_active = post_cache_dropdown;
				post_cache_dropdown.style.display = "flex";
			}
		})

		document.addEventListener("click", e => {
			if (post_cache_dropdown_active) {
				e.preventDefault();

				post_cache_dropdown_opener_active.style.display = "none";
				post_cache_dropdown_active.style.display = "none";

				post_cache_dropdown_opener_active = null;
				post_cache_dropdown_active = null;
			}
		})
	}


	// Delete Post Cache
	function setup_delete_post_cache(post_cache) {
		const post_cache_delete_button = post_cache.querySelector(".post-cache-delete");

		post_cache_delete_button.addEventListener("click", e => {
			e.stopPropagation();

			delete_post_cache(post_cache);
		});
	}

	function delete_post_cache(post_cache) {
		fetch("/post/caches", {
			method: "POST",
			headers:{"Content-Type": "application/json",},
			body: JSON.stringify({"post_cache_id": post_cache.dataset.id})
		}).then(response => {
			response.json().then(data => {
				if (data == "success") {
					post_cache.remove();
				} else if (data == "failure") {
					alert("Fatal Error: Please try again later");
				}
			});
		});
	}
}


// All User Pages
if (window.location.pathname.split("/")[1] === "user") {
	// Setup Posts
	const posts = document.querySelectorAll(".post-container");

	posts.forEach(post => {
		setup_post(post);
	});


	// Toggle Change Image Form Input
	const user_page_header_background_change_img_form_input = document.querySelector("#user-page-header-background-change-img-form-input");

	function show_change_image_form_input() {
		user_page_header_background_change_img_form_input.click();
	}


	// On Change Img Form Input
	const user_page_header_background_change_img_confirm_container = document.querySelector("#user-page-header-background-change-img-confirm-container");
	const user_page_header_background_img = document.querySelector("#user-page-header-background-img");
	const user_page_header_background_img_src = user_page_header_background_img.src;

	user_page_header_background_change_img_form_input.addEventListener("change", () => {
		const file = user_page_header_background_change_img_form_input.files[0];

		if (file) {
			user_page_header_background_img.src = URL.createObjectURL(file);
		}

		user_page_header_background_change_img_confirm_container.style.display = "flex";
	});


	// Cancel Change Img
	function hide_change_img_confirm() {
		user_page_header_background_change_img_form_input.value = null;
		user_page_header_background_img.src = user_page_header_background_img_src;
		user_page_header_background_change_img_confirm_container.style.display = "none";
	}
}


// User About
if (window.location.pathname.split("/").length == 4 && window.location.pathname.split("/")[3] == "about") {
	function edit_description_toggle() {
		const edit_description_button = document.querySelector("#edit-description-button");
		const user_description_form = document.querySelector("#user-description-form");
		const user_description = document.querySelector("#user-description-container > p");

		if (edit_description_button.style.display == "block") {
			edit_description_button.style.display = "none";
		} else {
			edit_description_button.style.display = "block";
		}

		if (user_description.style.display == "block") {
			user_description.style.display = "none";
		} else {
			user_description.style.display = "block";
		}

		if (user_description_form.style.display == "flex") {
			user_description_form.style.display = "none";
		} else {
			user_description_form.style.display = "flex";
		}
	}
}


// Account
if (window.location.pathname.split("/")[1] === "account") {
	// Toggle Account Change Image
	const account_change_image_modal = document.querySelector("#account-change-image-modal");
	const account_change_image = document.querySelector("#account-form-img-container > img")
	const account_change_image_preview_image = document.querySelector("#account-change-image-preview-image > img");
	const account_change_image_input = document.querySelector("#account-change-image-input");

	function show_account_change_image_modal() {
		account_change_image_modal.style.display = "flex";
	}

	function hide_account_change_image_modal() {
		account_change_image_modal.style.display = "none";
		account_change_image_preview_image.src = account_change_image.src;
		account_change_image_input.value = null;
	}


	// Submit Account Change Image Form
	const account_form = document.querySelector("#account-form");

	function submit_account_change_image_form() {
		account_form.requestSubmit();
	}


	// Show Account Change Image Input
	function show_account_change_image_form_input() {
		account_change_image_input.click();
	}

	account_change_image_input.addEventListener("change", () => {
		const file = account_change_image_input.files[0];

		if (file) {
			account_change_image_preview_image.src = URL.createObjectURL(file);
		}
	});
}