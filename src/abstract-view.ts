
export abstract class AbstractView{

    protected readonly viewRoot: HTMLElement;

    constructor(){
        this.viewRoot = document.createElement("div");
        document.body.appendChild(this.viewRoot);
    }

    public destroy(){
        this.viewRoot.remove();
    }

    public static nonNullQuerySelector(object: ParentNode, selector: string){
        const element = object.querySelector(selector);
        if (element){
            return element as HTMLElement;
        }else{
            throw new Error(`querySelector(${selector}==null`);
        }
    }
}