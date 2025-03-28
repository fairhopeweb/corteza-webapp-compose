<template>
  <div class="py-3">
    <portal to="topbar-title">
      {{ title }}
    </portal>

    <portal to="topbar-tools">
      <b-button-group
        v-if="isEdit"
        size="sm"
        class="mr-1"
      >
        <b-button
          variant="primary"
          :to="allRecords"
          class="d-flex align-items-center"
        >
          {{ $t('allRecords.label') }}
          <font-awesome-icon
            :icon="['fas', 'columns']"
            class="ml-2"
          />
        </b-button>
        <module-translator
          v-if="module"
          :module.sync="trModule"
          style="margin-left:2px;"
        />
      </b-button-group>
    </portal>

    <b-container
      v-if="module"
      tag="form"
      fluid="xl"
      @submit.prevent="handleSave"
    >
      <b-row no-gutters>
        <b-col>
          <b-card
            no-body
            class="shadow-sm"
          >
            <b-card-header
              v-if="isEdit"
              header-bg-variant="white border-bottom"
              class="py-3"
            >
              <b-row
                no-gutters
                class="wrap-with-vertical-gutters align-items-center"
              >
                <div class="flex-grow-1 wrap-with-vertical-gutters">
                  <b-button
                    v-if="federationEnabled"
                    variant="light"
                    size="lg"
                    class="mr-1"
                    @click="federationSettings.modal = true"
                  >
                    <font-awesome-icon
                      :icon="['fas', 'share-alt']"
                    />

                    {{ $t('edit.federationSettings.title') }}
                  </b-button>
                  <b-button
                    v-if="discoveryEnabled"
                    variant="light"
                    size="lg"
                    class="mr-1"
                    @click="discoverySettings.modal = true"
                  >
                    <font-awesome-icon
                      :icon="['fas', 'search-location']"
                    />
                    {{ $t('edit.discoverySettings.title') }}
                  </b-button>
                  <export
                    :list="[module]"
                    type="module"
                    class="mr-1"
                  />

                  <b-dropdown
                    v-if="module.canGrant"
                    size="lg"
                    variant="light"
                    class="permissions-dropdown mr-1"
                  >
                    <template #button-content>
                      <font-awesome-icon :icon="['fas', 'lock']" />
                      <span>
                        {{ $t('general.label.permissions') }}
                      </span>
                    </template>

                    <b-dropdown-item>
                      <c-permissions-button
                        :title="module.name"
                        :target="module.name"
                        :resource="`corteza::compose:module/${namespace.namespaceID}/${module.moduleID}`"
                        :button-label="$t('general:label.module')"
                        :show-button-icon="false"
                        button-variant="white text-left w-100"
                      />
                    </b-dropdown-item>

                    <b-dropdown-item>
                      <c-permissions-button
                        :title="module.name"
                        :target="module.name"
                        :resource="`corteza::compose:module-field/${namespace.namespaceID}/${module.moduleID}/*`"
                        :button-label="$t('general:label.field')"
                        :show-button-icon="false"
                        all-specific
                        button-variant="white text-left w-100"
                      />
                    </b-dropdown-item>

                    <b-dropdown-item>
                      <c-permissions-button
                        :title="module.name"
                        :target="module.name"
                        :resource="`corteza::compose:record/${namespace.namespaceID}/${module.moduleID}/*`"
                        :button-label="$t('general:label.record')"
                        :show-button-icon="false"
                        all-specific
                        button-variant="white text-left w-100"
                      />
                    </b-dropdown-item>
                  </b-dropdown>
                </div>
                <div
                  v-if="isEdit"
                  class="flex-grow-1 d-flex justify-content-md-end"
                >
                  <related-pages
                    :namespace="namespace"
                    :module="module"
                    size="lg"
                  />
                </div>
              </b-row>
            </b-card-header>
            <b-container
              fluid
              class="px-4 pt-3"
            >
              <h5 class="mb-3">
                {{ $t('edit.moduleInfo') }}
              </h5>
              <b-row>
                <b-col
                  cols="12"
                  md="6"
                  xl="4"
                >
                  <b-form-group>
                    <label
                      class="text-primary"
                    >
                      {{ $t('newLabel') }}
                    </label>
                    <b-form-input
                      v-model="module.name"
                      data-test-id="input-module-name"
                      required
                      :state="nameState"
                      :placeholder="$t('newPlaceholder')"
                    />
                  </b-form-group>
                </b-col>
                <b-col
                  cols="12"
                  md="6"
                  xl="4"
                >
                  <b-form-group>
                    <label class="text-primary">{{ $t('general.label.handle') }}</label>
                    <b-form-input
                      v-model="module.handle"
                      data-test-id="input-module-handle"
                      :state="handleState"
                      :placeholder="$t('general.placeholder.handle')"
                      class="mb-2"
                    />
                    <b-form-invalid-feedback :state="handleState">
                      {{ $t('general.placeholder.invalid-handle-characters') }}
                    </b-form-invalid-feedback>
                  </b-form-group>
                </b-col>
              </b-row>
            </b-container>
            <hr>
            <b-container
              fluid
              class="px-4"
            >
              <h5 class="mb-3">
                {{ $t('edit.manageRecordFields') }}
              </h5>
              <b-row no-gutters>
                <b-form-group class="w-100">
                  <table
                    data-test-id="table-module-fields"
                    class="table table-sm table-borderless table-responsive-lg"
                  >
                    <thead>
                      <tr>
                        <th />
                        <th
                          class="text-primary"
                        >
                          <div
                            class="d-flex align-items-center"
                          >
                            {{ $t('general.label.name') }}
                            <div
                              v-b-tooltip.hover.topright
                              :title="$t('edit.tooltip.name')"
                              class="ml-1"
                            >
                              <font-awesome-icon
                                :icon="['far', 'question-circle']"
                              />
                            </div>
                          </div>
                        </th>
                        <th
                          class="text-primary"
                        >
                          <div
                            class="d-flex align-items-center"
                          >
                            {{ $t('general.label.title') }}
                            <div
                              v-b-tooltip.hover.topright
                              :title="$t('edit.tooltip.title')"
                              class="ml-1"
                            >
                              <font-awesome-icon
                                :icon="['far', 'question-circle']"
                              />
                            </div>
                          </div>
                        </th>
                        <th class="text-primary">
                          {{ $t('general.label.type') }}
                        </th>
                        <th />
                        <th />
                      </tr>
                    </thead>
                    <draggable
                      v-model="module.fields"
                      :options="{handle:'.handle'}"
                      tag="tbody"
                    >
                      <field-row-edit
                        v-for="(field, index) in module.fields"
                        :key="index"
                        v-model="module.fields[index]"
                        :can-grant="namespace.canGrant"
                        :has-records="hasRecords"
                        :module="module"
                        :is-duplicate="!!duplicateFields[index]"
                        @edit="handleFieldEdit(module.fields[index])"
                        @delete="module.fields.splice(index, 1)"
                      />
                    </draggable>
                    <tr>
                      <td colspan="1" />
                      <td colspan="7">
                        <b-button
                          data-test-id="button-field-add"
                          class="mb-5"
                          variant="primary"
                          @click="handleNewField"
                        >
                          + {{ $t('edit.newField') }}
                        </b-button>
                      </td>
                    </tr>
                    <tr>
                      <td
                        colspan="7"
                        class="font-weight-bold"
                      >
                        {{ $t('edit.systemFields') }}
                      </td>
                    </tr>
                    <field-row-view
                      v-for="(field, index) in systemFields"
                      :key="index"
                      :field="field"
                      class="mt-4"
                    />
                  </table>
                </b-form-group>
              </b-row>
            </b-container>
          </b-card>
        </b-col>
      </b-row>

      <b-modal
        v-if="updateField"
        :title="editModalTitle"
        :ok-title="$t('general.label.saveAndClose')"
        ok-only
        ok-variant="primary"
        size="lg"
        :visible="!!updateField"
        body-class="p-0 border-top-0"
        header-class="p-3 pb-0 border-bottom-0"
        @ok="handleFieldSave(updateField)"
        @hide="updateField=null"
      >
        <field-configurator
          :field.sync="updateField"
          :namespace="namespace"
          :module="module"
        />
      </b-modal>

      <federation-settings
        v-if="federationEnabled"
        :modal="federationSettings.modal"
        :module="module"
        @change="federationSettings.modal = ($event || false)"
      />

      <discovery-settings
        v-if="discoveryEnabled"
        :modal.sync="discoverySettings.modal"
        :module.sync="module"
        @save="onDiscoverySettingsSave"
      />
    </b-container>

    <portal to="admin-toolbar">
      <editor-toolbar
        :processing="processing"
        :back-link="{ name: 'admin.modules' }"
        :hide-delete="hideDelete"
        hide-clone
        :hide-save="hideSave"
        :disable-save="disableSave"
        @delete="handleDelete"
        @save="handleSave()"
        @saveAndClose="handleSave({ closeOnSuccess: true })"
      />
    </portal>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import draggable from 'vuedraggable'
import FieldConfigurator from 'corteza-webapp-compose/src/components/ModuleFields/Configurator'
import FieldRowEdit from 'corteza-webapp-compose/src/components/Admin/Module/FieldRowEdit'
import FieldRowView from 'corteza-webapp-compose/src/components/Admin/Module/FieldRowView'
import FederationSettings from 'corteza-webapp-compose/src/components/Admin/Module/FederationSettings'
import DiscoverySettings from 'corteza-webapp-compose/src/components/Admin/Module/DiscoverySettings'
import ModuleTranslator from 'corteza-webapp-compose/src/components/Admin/Module/ModuleTranslator'
import RelatedPages from 'corteza-webapp-compose/src/components/Admin/Module/RelatedPages'
import { compose, NoID } from '@cortezaproject/corteza-js'
import EditorToolbar from 'corteza-webapp-compose/src/components/Admin/EditorToolbar'
import Export from 'corteza-webapp-compose/src/components/Admin/Export'
import { handleState } from 'corteza-webapp-compose/src/lib/handle'

export default {
  i18nOptions: {
    namespaces: 'module',
  },

  components: {
    draggable,
    FieldConfigurator,
    FieldRowEdit,
    FieldRowView,
    FederationSettings,
    DiscoverySettings,
    ModuleTranslator,
    RelatedPages,
    EditorToolbar,
    Export,
  },

  props: {
    namespace: {
      type: compose.Namespace,
      required: true,
    },

    moduleID: {
      type: String,
      required: false,
      default: NoID,
    },
  },

  data () {
    return {
      updateField: null,
      module: undefined,
      hasRecords: true,
      processing: false,

      federationSettings: {
        modal: false,
      },

      discoverySettings: {
        modal: false,
      },
    }
  },

  computed: {
    ...mapGetters({
      pages: 'page/set',
    }),

    title () {
      return this.isEdit ? this.$t('edit.edit') : this.$t('edit.create')
    },

    trModule: {
      get () {
        if (!this.module) {
          return new compose.Module()
        }
        return this.module
      },
      set (v) {
        this.module = v
        this.updateModuleSet(v)
      },
    },

    nameState () {
      return this.module.name.length > 0 ? null : false
    },

    handleState () {
      return handleState(this.module.handle)
    },

    duplicateFields () {
      const rtr = {}
      const ix = new Set()
      const { fields = [] } = this.module || {}

      fields.forEach((f, i) => {
        if (ix.has(f.name)) {
          rtr[i] = f
        }
        ix.add(f.name)
      })

      return rtr
    },

    fieldsValid () {
      const { fields = [] } = this.module || {}
      const valid = !fields.some(f => {
        return f.fieldID === NoID && !f.isValid
      })

      const unique = Object.keys(this.duplicateFields).length === 0

      return valid && unique
    },

    systemFields () {
      return this.module.systemFields().map(sf => {
        sf.label = this.$t(`field:system.${sf.name}`)
        return sf
      })
    },

    editModalTitle () {
      if (!this.updateField) {
        return
      }

      const { name } = this.updateField
      return name ? this.$t('edit.specificFieldSettings', { name: this.updateField.name }) : this.$t('edit.moduleFieldSettings')
    },

    federationEnabled () {
      return this.isEdit && this.$Settings.get('federation.enabled', false)
    },

    discoveryEnabled () {
      return this.$Settings.get('discovery.enabled', false)
    },

    hideDelete () {
      return !this.isEdit || !this.module.canDeleteModule || !!this.module.deletedAt
    },

    disableSave () {
      return !this.module || [this.fieldsValid, this.nameState, this.handleState].includes(false)
    },

    hideSave () {
      return this.isEdit && !this.module.canUpdateModule
    },

    isEdit () {
      return this.module && this.module.moduleID !== NoID
    },

    allRecords () {
      return this.isEdit ? { name: 'admin.modules.record.list', params: { moduleID: this.moduleID } } : undefined
    },
  },

  watch: {
    moduleID: {
      immediate: true,
      handler (moduleID) {
        if (moduleID === NoID) {
          this.module = new compose.Module(
            { fields: [new compose.ModuleFieldString({ fieldID: NoID, name: this.$t('general.placeholder.sample') })] },
            this.namespace,
          )
        } else {
          this.findModuleByID({ namespace: this.namespace, moduleID: moduleID }).then((module) => {
            // Make a copy so that we do not change store item by ref
            this.module = module.clone()

            const { moduleID, namespaceID } = this.module

            // Count existing records to see what we can do with this module
            this.$ComposeAPI
              .recordList({ moduleID, namespaceID, limit: 1 })
              .then(({ set }) => { this.hasRecords = (set.length > 0) })
          })
        }
      },
    },
  },

  methods: {
    ...mapActions({
      findModuleByID: 'module/findByID',
      updateModule: 'module/update',
      updateModuleSet: 'module/updateSet',
      createModule: 'module/create',
      deleteModule: 'module/delete',
      deletePage: 'page/delete',
    }),

    handleNewField () {
      this.module.fields.push(new compose.ModuleFieldString())
    },

    handleFieldEdit (field) {
      this.updateField = compose.ModuleFieldMaker({ ...field })
    },

    handleFieldSave (field) {
      const i = this.module.fields.findIndex(f => f.name === field.name)
      if (i > -1) {
        this.module.fields.splice(i, 1, field)
      }
    },

    onDiscoverySettingsSave (meta) {
      this.module.meta = { ...this.module.meta, ...meta }
    },

    handleSave ({ closeOnSuccess = false } = {}) {
      /**
       * Pass a special tag alongside payload that
       * instructs store layer to add content-language header to the API request
       */
      const resourceTranslationLanguage = this.currentLanguage
      this.processing = true

      if (!this.isEdit) {
        // Filter out record fields that reference this not yet created module
        let fields = []
        const toBeUpdatedFields = []
        this.module.fields.forEach(f => {
          if (f.kind === 'Record' && f.options.moduleID === '-1') {
            toBeUpdatedFields.push(f)
          } else {
            fields.push(f)
          }
        })

        // If such fields exist , after module is created add fields, map moduleID and update module
        // Unfortunately this ruins the initial field order, but we can improve this later
        this.createModule({ ...this.module, fields, resourceTranslationLanguage }).then(async module => {
          if (toBeUpdatedFields.length) {
            fields = [
              ...module.fields,
              ...toBeUpdatedFields.map(f => {
                f.options.moduleID = module.moduleID
                return f
              }),
            ]

            module = await this.updateModule({ ...module, fields })
          }

          this.module = new compose.Module({ ...module }, this.namespace)

          this.toastSuccess(this.$t('notification:module.saved'))
          if (closeOnSuccess) {
            this.$router.push({ name: 'admin.modules' })
          } else {
            this.$router.push({ name: 'admin.modules.edit', params: { moduleID: this.module.moduleID } })
          }
        }).catch(this.toastErrorHandler(this.$t('notification:module.saveFailed')))
          .finally(() => {
            this.processing = false
          })
      } else {
        this.updateModule({ ...this.module, resourceTranslationLanguage }).then(module => {
          this.module = new compose.Module({ ...module }, this.namespace)
          this.toastSuccess(this.$t('notification:module.saved'))
          if (closeOnSuccess) {
            this.$router.push({ name: 'admin.modules' })
          }
        }).catch(this.toastErrorHandler(this.$t('notification:module.saveFailed')))
          .finally(() => {
            this.processing = false
          })
      }
    },

    handleDelete () {
      this.processing = true

      this.deleteModule(this.module).then(() => {
        const moduleRecordPage = this.pages.find(p => p.moduleID === this.module.moduleID)
        if (moduleRecordPage) {
          return this.deletePage({ ...moduleRecordPage, strategy: 'rebase' })
        }
      }).catch(this.toastErrorHandler(this.$t('notification:module.deleteFailed')))
        .finally(() => {
          this.toastSuccess(this.$t('notification:module.deleted'))
          this.processing = false
          this.$router.push({ name: 'admin.modules' })
        })
    },
  },
}
</script>

<style lang="scss">
.permissions-dropdown {
  .dropdown-item {
    padding: 0;
  }
}
</style>
