<script>
import {getDisplayTime} from "../services/displayTime.js"
export let image;

let landscapeClass = "portrait";

function imageLoaded(e) {
   if(e.target.width > e.target.height){
       landscapeClass = "landscape";
   }
}
function saveImage(image){
    localStorage.setItem('currentImage',JSON.stringify(image));
}

</script>

<div class="imageContainer">
<a href="/images/{image.imageKey}" on:click="{saveImage(image)}">
    <div class="imageText">{ image.imageTitle }</div>
    <div class="square">
    <img src="{image.thumbnail}" class="{landscapeClass}" on:load="{imageLoaded}" alt="{image.funimage}" />
    </div>
    <div class="imageText">{ image.funFact }</div>
    <div class="imageSubtitle">{ getDisplayTime(image.insertTime) }</div>
</a>
</div>

<style>
.imageContainer {
    border: solid #b7b3b3 2px;
    width: 100%;
    margin: 5px;
    padding: 15px 15px;
    background-color: #ffff65;
    box-shadow: -3px -6px #d1d2b72e;
    font-size: 18px;
}
.imageText{
    width:100%;
}
.imageSubtitle{
    font-size: 12px;
    float:right;
}

  .square {
     position: relative;
     width: 200px;     
     height: 200px;
     overflow: hidden;
     margin: auto;
  }
  img {
     position: absolute;
     max-width: 100%;
     width: 100%;
     height: auto;
     top: 50%;     
     left: 50%;
     transform: translate( -50%, -50%);
 }
  img.landscape {
    height: 100%;
    width: auto;
    object-fit: cover;
}
</style>