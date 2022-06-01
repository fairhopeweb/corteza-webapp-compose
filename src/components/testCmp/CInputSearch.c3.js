import component from './CInputSearch.vue'
// import { components } from '@cortezaproject/corteza-vue'
// const { input } = components.C3.controls

const props = {
  placeholder: 'Hello',
}

export default {
  name: 'CInputSearch',
  group: ['Test-me'],
  controls: [],
  component,
  props,
  // controls: [
  //   input('Button class', 'buttonClass'),
  //   input('Button variant', 'buttonVariant'),
  // ],
}
