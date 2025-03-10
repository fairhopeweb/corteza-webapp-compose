<template>
  <wrap
    class="d-print-block"
    v-bind="$props"
    v-on="$listeners"
  >
    <div class="calendar-container m-2">
      <div
        v-if="!header.hide"
      >
        <div
          v-if="!header.hidePrevNext || !header.hideTitle"
          class="d-flex align-items-baseline justify-content-center mb-2"
        >
          <b-btn
            v-if="!header.hidePrevNext"
            variant="link"
            class="text-dark"
            @click="api().prev()"
          >
            <font-awesome-icon :icon="['fas', 'angle-left']" />
          </b-btn>
          <span
            v-if="!header.hideTitle"
            class="h5"
          >
            {{ title }}
          </span>
          <b-btn
            v-if="!header.hidePrevNext"
            variant="link"
            class="text-dark"
            @click="api().next()"
          >
            <font-awesome-icon :icon="['fas', 'angle-right']" />
          </b-btn>
        </div>
        <b-row
          no-gutters
        >
          <b-col
            cols="12"
            sm="10"
            md="9"
            lg="8"
            xl="9"
            class="d-flex justify-content-sm-start justify-content-center flex-wrap"
          >
            <b-btn
              v-for="view in views"
              :key="view"
              variant="light"
              class="mr-1 mb-1"
              @click="api().changeView(view)"
            >
              {{ $t(`calendar.view.${view}`) }}
            </b-btn>
          </b-col>
          <b-col
            v-if="!header.hideToday && !header.hide"
            cols="12"
            sm="2"
            md="3"
            lg="4"
            xl="3"
            class="d-flex justify-content-end"
          >
            <b-btn
              variant="light"
              class="mb-1 w-100"
              @click="api().today()"
            >
              {{ $t(`calendar.today`) }}
            </b-btn>
          </b-col>
        </b-row>
      </div>
      <div
        v-if="processing"
        class="d-flex align-items-center justify-content-center h-100"
      >
        <b-spinner />
      </div>
      <full-calendar
        v-else
        ref="fc"
        :events="events"
        v-bind="config"
        class="my-1"
        @eventClick="handleEventClick"
      />
    </div>
  </wrap>
</template>

<script>
import moment from 'moment'
import { mapGetters, mapActions } from 'vuex'
import base from './base'
import FullCalendar from '@fullcalendar/vue'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import listPlugin from '@fullcalendar/list'
import { compose, NoID } from '@cortezaproject/corteza-js'
import { BootstrapTheme } from '@fullcalendar/bootstrap'
import { createPlugin } from '@fullcalendar/core'
import { evaluatePrefilter } from 'corteza-webapp-compose/src/lib/record-filter'

/**
 * FullCalendar Corteza theme definition.
 */
export class CortezaTheme extends BootstrapTheme {}
CortezaTheme.prototype.classes.widget = 'corteza-unthemed'
CortezaTheme.prototype.classes.button = 'btn btn-outline-primary'

CortezaTheme.prototype.baseIconClass = 'fc-icon'
CortezaTheme.prototype.iconClasses = {
  close: 'fc-icon-x',
  prev: 'fc-icon-chevron-left',
  next: 'fc-icon-chevron-right',
  prevYear: 'fc-icon-chevrons-left',
  nextYear: 'fc-icon-chevrons-right',
}

CortezaTheme.prototype.iconOverrideOption = 'buttonIcons'
CortezaTheme.prototype.iconOverrideCustomButtonOption = 'icon'
CortezaTheme.prototype.iconOverridePrefix = 'fc-icon-'

export default {
  i18nOptions: {
    namespaces: 'block',
  },

  components: {
    FullCalendar,
  },

  extends: base,

  data () {
    return {
      processing: false,

      events: [],
      locale: undefined,
      title: '',

      loaded: {
        start: null,
        end: null,
      },
    }
  },

  computed: {
    ...mapGetters({
      pages: 'page/set',
    }),

    config () {
      return {
        header: false,
        height: 'parent',
        themeSystem: 'corteza',
        defaultView: 'dayGridMonth',
        editable: false,
        eventLimit: true,
        locale: this.locale,
        // @todo could be loaded on demand
        plugins: [
          dayGridPlugin,
          timeGridPlugin,
          listPlugin,
          createPlugin({
            themeClasses: {
              corteza: CortezaTheme,
            },
          }),
        ],

        // Handle event fetching when view/date-range changes
        datesRender: ({ view: { activeStart, activeEnd, title } = {} } = {}) => {
          this.loadEvents(moment(activeStart), moment(activeEnd))
          // eslint-disable-next-line
          this.title = title
        },
      }
    },

    header () {
      return this.block.options.header
    },

    views () {
      if (this.header.hide) {
        return []
      }

      return this.block.reorderViews(this.header.views)
    },
  },

  watch: {
    'boundingRect.height': {
      handler: function () {
        // This is required, since vue-grid calculates grid item's dimensions
        // inside mounted hook
        setTimeout(() => {
          const fc = this.$refs.fc
          if (!fc) {
            return
          }
          fc.getApi().windowResize({ target: window })
          fc.getApi().updateSize()
        })
      },
      immediate: true,
    },
  },

  created () {
    this.changeLocale(this.currentLanguage)
  },

  methods: {
    ...mapActions({
      findModuleByID: 'module/findByID',
    }),

    /**
     * Helper method to load requested locale.
     * See https://github.com/fullcalendar/fullcalendar/tree/master/packages/core/src/locales
     * for a full list
     * @param {String} lng Locale tag.
     */
    changeLocale (lng = 'en-gb') {
      // fc doesn't provide a en locale
      if (lng === 'en') {
        lng = 'en-gb'
      }

      this.locale = require(`@fullcalendar/core/locales/${lng}`)
    },

    // Proxy to the FC API
    api () {
      return this.$refs.fc.getApi()
    },

    /**
     * Loads & preps fc events from `start` to `end` for all defined feeds.
     * @param {Moment} start Start date
     * @param {Moment} end End date
     */
    loadEvents (start, end) {
      if (!start || !end) {
        return
      }

      if (start.isSame(this.loaded.start) && end.isSame(this.loaded.end)) {
        return
      }

      this.loaded.start = start
      this.loaded.end = end

      this.events = []

      this.processing = true

      Promise.all(this.options.feeds.map(feed => {
        switch (feed.resource) {
          case compose.PageBlockCalendar.feedResources.record:
            return this.findModuleByID({ namespace: this.namespace, moduleID: feed.options.moduleID })
              .then(module => {
                const ff = {
                  ...feed,
                  options: { ...feed.options },
                }

                // Interpolate prefilter variables
                if (ff.options.prefilter) {
                  ff.options.prefilter = evaluatePrefilter(ff.options.prefilter, {
                    record: this.record,
                    recordID: (this.record || {}).recordID || NoID,
                    ownerID: (this.record || {}).userID || NoID,
                    userID: (this.$auth.user || {}).userID || NoID,
                  })
                }

                return compose.PageBlockCalendar.RecordFeed(this.$ComposeAPI, module, this.namespace, ff, this.loaded)
                  .then(events => {
                    this.events.push(...events)
                  })
              })
          case compose.PageBlockCalendar.feedResources.reminder:
            return compose.PageBlockCalendar.ReminderFeed(this.$SystemAPI, this.$auth.user, feed, this.loaded)
              .then(events => {
                this.events.push(...events)
              })
        }
      }))
        .finally(() => {
          this.processing = false
        })
    },

    /**
     * Based on event type, perform some action.
     * @param {Event} event Fullcalendar event object
     */
    handleEventClick ({ event: { extendedProps: { recordID, moduleID } } }) {
      if (!moduleID || !recordID) {
        return
      }

      const page = this.pages.find(p => p.moduleID === moduleID)
      if (!page) {
        return
      }

      this.$router.push({ name: 'page.record', params: { recordID, pageID: page.pageID } })
    },
  },
}
</script>
<style lang="scss" scoped>
@import '~@fullcalendar/core/main.css';
@import '~@fullcalendar/daygrid/main.css';
@import '~@fullcalendar/timegrid/main.css';
@import '~@fullcalendar/list/main.css';

</style>
<style lang="scss">
.calendar-container {
  height: calc(100% - 7em);

  .fc-content {
    cursor: pointer;
  }

  .fc-day-header {
    white-space: pre-wrap;
  }
}
</style>
