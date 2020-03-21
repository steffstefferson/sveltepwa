<script>
import {getDisplayTime} from "../services/displayTime.js"
  import Card from '@smui/Card';

export let fact;
</script>

  <div style="display: flex; flex-wrap: wrap;">
    <div class="card-container short factContainer">
      <Card style="background-color: #ffff65;" padded>{ fact.fact }
      <div class="factSubtitle">{ getDisplayTime(fact.insertTime) } | by {fact.contributor}</div>
      </Card>
    </div>
    </div>


<style>
.factContainer {
    width: 350px; 
}

.factSubtitle{
    font-size: 12px;
    text-align:right;
}
</style>