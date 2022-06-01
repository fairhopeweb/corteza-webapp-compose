<template>
  <b-input-group>
    <b-input
      v-model.trim="value"
      data-test-id="input-search"
      class="border-light border-right-0 pr-0 h-100 text-truncate"
      type="search"
      name="search"
      :disabled="disable"
      :placeholder="placeholder"
      :debounce="debounce"
      @input="$emit('search', $event)"
    />
    <b-input-group-append>
      <b-input-group-text
        class="text-primary bg-white border-left-0"
      >
        <font-awesome-icon
          v-if="!hideIcon"
          :icon="['fas', 'search']"
        />
      </b-input-group-text>
    </b-input-group-append>
  </b-input-group>
</template>

<script>
export default {
  props: {
    value: {
      type: String,
      default: '',
    },

    placeholder: {
      type: String,
      required: true,
      default: '',
    },

    disable: {
      type: Boolean,
    },

    hideIcon: {
      type: Boolean,
    },

    debounce: {
      type: Number,
      default: 0,
    },
  },

  data () {
    return {
      query: '',
      items: [],
    }
  },

  computed: {
    filteredAvailable: {
      get () {
        const q = this.query.toLowerCase()
        return this.items.filter(i => i.text.toLowerCase().indexOf(q) > -1)
      },

      set (i) {
        this.items = i
      },
    },
  },
}
</script>
