<script>
import {getImage} from "../services/imageSerivce.js"
import IconButton, {Icon} from '@smui/icon-button';
import { getDisplayTime } from "../services/displayTime.js";
import page from "page"

export let params;

let showText = true;
console.log(params);
let backgroundStyle = "";
let image = load(params.key,0);
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
    page('/images/slideShow?key='+imageKey);

    return img;
}

</script>
<div class="container" style="{backgroundStyle}">
    <div class="showHideInfoArea" on:mousedown="{toggleText}" on:mouseup="{toggleText}"> </div>
    <div class="textContainer" style="visibility: {showText ? 'inherit' : 'hidden'}">
        <div>
            <div>
                <span class="title">{ image.imageTitle }</span>
                <span>{ getDisplayTime(image.insertTime) }</span>
                <a href="{backUrl}">x</a>
            </div>
            <div class="text">{ image.funFact }</div>
            <div class="subtitle"></div>
        </div>
        <div>
         <IconButton on:click="{getPreviousImage}" style="font-size:40px" class="material-icons" aria-label="Back">navigate_before</IconButton>
         <IconButton on:click="{() => page('map?key='+image.key)}" style="font-size:40px" class="material-icons" aria-label="Open map">place</IconButton>
         <IconButton on:click="{() => page(backUrl)}" style="font-size:40px" class="material-icons" aria-label="Close">close</IconButton>
         <IconButton on:click="{getNextImage}" style="font-size:40px" class="material-icons" aria-label="Next">navigate_next</IconButton>
        </div>
    </div>  
</div>

<style>
.container {
    height: 100%; 
    background-position: center;
    background-repeat: no-repeat;
    background-size: cover;
    width: 100%;
    position: absolute;
    top: 0px;
}

.textContainer{
    background-color: yellow;
    border: 1px black solid;
    padding: 10px;
    margin: 10px;
    display: grid;
    grid-template-columns: 55% auto;
    position: absolute;
    bottom: 0px;
}

.textContainer div{
    width:100%;
}

.showHideInfoArea{
    height: 80%;
    position: absolute;
    bottom: 20%;
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