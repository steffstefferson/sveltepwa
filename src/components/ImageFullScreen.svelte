<script>
import {getImage} from "../services/imageSerivce.js"
import { getDisplayTime } from "../services/displayTime.js";

export let params;

let showText = true;
console.log(params);
let backgroundStyle = "";
let image = load(params.imageKey,0);
let backUrl = "/images";

function toggleText(){
    showText = !showText;
}

function getPreviousImage(e){
    image = load(image.imageKey,-1);
}

function getNextImage(e){
    image = load(image.imageKey,1);
}

function load(imageKey,offset){
    const img = getImage(imageKey,offset);
    backgroundStyle = "background-image: url("+(img.fullImageSizeUrl || img.thumbnail)+")";
    if(!img.fullImageSizeUrl){
    img.loadFullSizeImage().then((fullSizeImageUrl) =>{
        backgroundStyle = "background-image: url("+fullSizeImageUrl+")";
    });
    }
    return img;
}

</script>
<div class="container" style="{backgroundStyle}">
    <div class="showHideInfoArea" on:mousedown="{toggleText}" on:mouseup="{toggleText}"> </div>
    <div class="textContainer" style="visibility: {showText ? 'inherit' : 'hidden'}">
        <button on:click="{getPreviousImage}">back</button>
        <div>
            <div>
                <span class="title">{ image.imageTitle }</span>
                <span>{ getDisplayTime(image.insertTime) }</span>
                <a href="{backUrl}">x</a>
            </div>
            <div class="text">{ image.funFact }</div>
            <div class="subtitle"></div>
        </div>
        <button on:click="{getNextImage}">next</button>
    </div>
    
</div>

<style>
.container {
    height: 100%; 
    background-position: center;
    background-repeat: no-repeat;
    background-size: cover;
    height: 100%;
    position: absolute;
    top: 0px;
}

.textContainer{
    background-color: yellow;
    border: 1px black solid;
    padding: 10px;
    margin: 10px;
    display: grid;
    grid-template-columns: 50px auto 50px;
}
.textContainer div{
    width:100%;
}

.showHideInfoArea{
    height: 80%;
    position: absolute;
    top: 20%;
    border: none;
    width: 100%;
}

.title{
    font-size:18px;
}
.text{
    font-size:14px;
}

</style>