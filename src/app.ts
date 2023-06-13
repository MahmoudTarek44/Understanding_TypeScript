// Validation
interface Validatable {
	value: string | number;
	required?: boolean;
	minLength?: number;
	maxLength?: number;
	min?: number;
	max?: number;
}

function validate(inputField: Validatable): boolean {
	let isValid: boolean = true;
	if (inputField.required) {
		isValid = isValid && inputField.value.toString().trim().length !== 0;
	}
	if (inputField.minLength != null && typeof inputField.value === "string") {
		isValid = isValid && inputField.value.length >= inputField.minLength;
	}
	if (inputField.maxLength != null && typeof inputField.value === "string") {
		isValid = isValid && inputField.value.length <= inputField.maxLength;
	}
	if (inputField.min != null && typeof inputField.value === "number") {
		isValid = isValid && inputField.value >= inputField.min;
	}
	if (inputField.max != null && typeof inputField.value === "number") {
		isValid = isValid && inputField.value <= inputField.max;
	}

	return isValid;
}

// autoBind decorator
function autoBind(_: any, _2: string, descriptor: PropertyDescriptor) {
	const originalMethod = descriptor.value;
	const adjustedMethod: PropertyDescriptor = {
		configurable: true,
		get() {
			const boundFn = originalMethod.bind(this);
			return boundFn;
		},
	};
	return adjustedMethod;
}

// ProjectState Class

class ProjectState {
	private listeners: Function[] = [];
	private projects: any[] = [];
	private static instance: ProjectState;

	private constructor() {}

	static getInstance() {
		if (this.instance) {
			return this.instance;
		} else {
			this.instance = new ProjectState();
			return this.instance;
		}
	}

	addListener(listenerFn: Function) {
		this.listeners.push(listenerFn);
	}

	addProject(title: string, description: string, people: number) {
		const newProject = {
			id: Math.random().toString(),
			title,
			description,
			people,
		};
		this.projects.push(newProject);
		for (const listener of this.listeners) {
			listener(this.projects.slice());
		}
	}
}

const projectState = ProjectState.getInstance();

// ProjectList Class
class ProjectList {
	templateElement!: HTMLTemplateElement;
	hostElement!: HTMLDivElement;
	element!: HTMLElement;
	assignedProjects: any[] = [];

	constructor(private type: "active" | "finished") {
		this.domInitGetters();
		this.importContent();
		this.attach();
		this.renderContent();

		projectState.addListener((projects: any[]) => {
			this.assignedProjects = projects;
			this.renderProjects();
		});
	}

	private domInitGetters() {
		this.templateElement = document.getElementById(
			"project-list"
		)! as HTMLTemplateElement;
		this.hostElement = document.getElementById("app")! as HTMLDivElement;
	}

	private importContent() {
		const importedNode = document.importNode(
			this.templateElement.content,
			true
		);
		this.element = importedNode.firstElementChild as HTMLElement;
		this.element.id = `${this.type}-projects`;
	}

	private renderProjects() {
		const listElement = document.getElementById(
			`${this.type}-projects-list`
		)! as HTMLUListElement;
		for (const proj of this.assignedProjects) {
			const listItem = document.createElement("li");
			listElement.textContent = proj.title;
			listElement.appendChild(listItem);
		}
	}

	private renderContent() {
		const listID = `${this.type}-projects-list`;
		this.element.querySelector("ul")!.id = listID;
		this.element.querySelector("h2")!.textContent =
			this.type.toUpperCase() + " PROJECTS";
	}

	private attach() {
		this.hostElement.insertAdjacentElement("beforeend", this.element);
	}
}

// ProjectInput Class
class ProjectInput {
	templateElement!: HTMLTemplateElement;
	hostElement!: HTMLDivElement;
	element!: HTMLFormElement;

	// form inputs
	titleInputElement!: HTMLInputElement;
	descriptionInputElement!: HTMLInputElement;
	peopleInputElement!: HTMLInputElement;

	constructor() {
		this.domInitGetters();
		this.importContent();
		this.configure();
		this.attach();
	}

	private domInitGetters() {
		this.templateElement = document.getElementById(
			"project-input"
		)! as HTMLTemplateElement;
		this.hostElement = document.getElementById("app")! as HTMLDivElement;
	}

	private importContent() {
		const importedNode = document.importNode(
			this.templateElement.content,
			true
		);
		this.element = importedNode.firstElementChild as HTMLFormElement;
		this.element.id = "user-input";

		this.descriptionInputElement = this.element.querySelector(
			"#description"
		)! as HTMLInputElement;
		this.peopleInputElement = this.element.querySelector(
			"#people"
		)! as HTMLInputElement;
		this.titleInputElement = this.element.querySelector(
			"#title"
		)! as HTMLInputElement;
	}

	private attach() {
		this.hostElement.insertAdjacentElement("afterbegin", this.element);
	}

	private gatherUserInput(): [string, string, number] | void {
		const titleValue = this.titleInputElement.value;
		const descriptionValue = this.descriptionInputElement.value;
		const peopleValue = this.peopleInputElement.value;

		const titleValidatable: Validatable = {
			value: titleValue,
			required: true,
		};
		const descriptionValidatable: Validatable = {
			value: descriptionValue,
			required: true,
			minLength: 5,
		};
		const peopleValidatable: Validatable = {
			value: +peopleValue,
			required: true,
			min: 1,
			max: 5,
		};

		if (
			!validate(titleValidatable) ||
			!validate(descriptionValidatable) ||
			!validate(peopleValidatable)
		) {
			alert("Invalid input, please try again!");
			return;
		} else {
			return [titleValue, descriptionValue, +peopleValue];
		}
	}

	private clearForm() {
		this.descriptionInputElement.value = "";
		this.peopleInputElement.value = "";
		this.titleInputElement.value = "";
	}

	@autoBind
	private submitHandler(event: Event) {
		event.preventDefault();
		const userInput = this.gatherUserInput();
		if (Array.isArray(userInput)) {
			const [title, desc, people] = userInput;
			projectState.addProject(title, desc, people);
			this.clearForm();
		}
	}

	private configure() {
		this.element.addEventListener("submit", this.submitHandler.bind(this));
	}
}

const myProjectInput = new ProjectInput();
const myActiveProjectList = new ProjectList("active");
const myFinishedProjectList = new ProjectList("finished");
