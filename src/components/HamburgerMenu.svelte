<script>
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	function menuToggled() {
		dispatch('message', {});
	}
</script>

<div class="row">
    <input type="checkbox" id="hamburg" on:click={menuToggled}>
    <label for="hamburg" class="hamburg">
        <span class="line"></span>
        <span class="line"></span>
        <span class="line"></span>
    </label>
</div>

<style>
label.hamburg { 
   display: block;
   background: #555; width: 75px; height: 100%; 
   position: relative; 
   margin-left: auto; margin-right: auto;
   border-radius: 4px; 
}

input#hamburg {display:none}

	.line { 
   position: absolute; 
   left:10px;
   height: 4px; width: 55px; 
   background: #fff; border-radius: 2px;
   display: block; 
   transition: 0.5s; 
   transform-origin: center; 
}

.line:nth-child(1) { top: 12px; }
.line:nth-child(2) { top: 24px; }
.line:nth-child(3) { top: 36px; }

#hamburg:checked + .hamburg .line:nth-child(1){
   transform: translateY(12px) rotate(-45deg);
}

#hamburg:checked + .hamburg .line:nth-child(2){
   opacity:0;
}

#hamburg:checked + .hamburg .line:nth-child(3){
   transform: translateY(-12px) rotate(45deg);
}
</style>