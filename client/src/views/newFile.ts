import { onMounted } from 'vue';
import { updateUser } from './LoginPage.vue';

onMounted(() => {
  updateUser();
}).catch((err) => {
  console.log("Error in onMounted", err);
});
