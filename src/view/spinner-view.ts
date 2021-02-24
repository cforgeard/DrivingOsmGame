import { AbstractView } from "../abstract-view";

export class SpinnerView extends AbstractView {

    constructor() {
        super();
        this.viewRoot.classList.add("pageloader");

        this.viewRoot.innerHTML = `
        <span class="title">Chargement...</span>
        `;
    }

    public setSpinnerActive(active: boolean) {
        if (active){
            this.viewRoot.classList.add("is-active");
        }else{
            this.viewRoot.classList.remove("is-active");
        }
    }
}