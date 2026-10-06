import { createRouter, createWebHashHistory } from 'vue-router';
import Exam from './views/Exam.vue';
import Flashcards from './views/Flashcards.vue';
import History from './views/History.vue';
import Home from './views/Home.vue';
import ParentHome from './views/parent/ParentHome.vue';
import ProfilePicker from './views/ProfilePicker.vue';
import Result from './views/Result.vue';
import Review from './views/Review.vue';
import Settings from './views/Settings.vue';

const routes = [
  { path: '/', redirect: '/profiles' },
  { path: '/profiles', component: ProfilePicker },
  { path: '/home', component: Home },
  { path: '/exam', component: Exam },
  { path: '/review', component: Review },
  { path: '/result', component: Result },
  { path: '/flashcards', component: Flashcards },
  { path: '/history', component: History },
  { path: '/settings', component: Settings },
  { path: '/parent', component: ParentHome }
];

export const router = createRouter({
  history: createWebHashHistory(),
  routes
});
