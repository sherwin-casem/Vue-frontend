<!-- @ts-nocheck -->
<template>
  <div class="chargepoints-management">
    <v-card elevation="2">
      <v-card-title class="chargepoints-header">
        <h1 class="text-h4">
          {{ $t('chargepoints.title') }}
        </h1>
        <p class="text-subtitle-1 text-medium-emphasis">
          {{ $t('chargepoints.manageAllChargePoints') }}
        </p>
      </v-card-title>

      <v-card-text>
        <div class="action-bar">
          <v-btn
            color="primary"
            variant="elevated"
            prepend-icon="mdi-plus"
            :disabled="chargePointsStore.loading"
            @click="openCreateDialog"
          >
            {{ $t('chargepoints.addChargePoint') }}
          </v-btn>

          <v-spacer />

          <div class="search-container">
            <v-text-field
              v-model="globalSearch"
              prepend-icon="mdi-magnify"
              :label="$t('common.search')"
              variant="outlined"
              density="compact"
              hide-details
              clearable
              class="search-field"
            />
          </div>

          <v-menu>
            <template #activator="{ props }">
              <v-btn
                variant="outlined"
                prepend-icon="mdi-export"
                v-bind="props"
                :disabled="!chargePoints.length || chargePointsStore.loading"
                class="export-btn"
              >
                {{ $t('export.export') }}
                <v-icon>mdi-chevron-down</v-icon>
              </v-btn>
            </template>
            <v-list>
              <v-list-item @click="exportToPdf">
                <v-list-item-title>
                  <v-icon start> mdi-file-pdf-box </v-icon>
                  {{ $t('export.exportToPdf') }}
                </v-list-item-title>
              </v-list-item>
              <v-list-item @click="exportToExcel">
                <v-list-item-title>
                  <v-icon start> mdi-file-excel </v-icon>
                  {{ $t('export.exportToExcel') }}
                </v-list-item-title>
              </v-list-item>
              <v-list-item @click="exportToCsv">
                <v-list-item-title>
                  <v-icon start> mdi-file-delimited </v-icon>
                  {{ $t('export.exportToCsv') }}
                </v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>

          <v-menu>
            <template #activator="{ props }">
              <v-btn
                variant="outlined"
                prepend-icon="mdi-view-column"
                v-bind="props"
                class="column-selector-btn"
              >
                {{ $t('common.selectColumns') }}
                <v-icon>mdi-chevron-down</v-icon>
              </v-btn>
            </template>
            <v-list>
              <v-list-item
                v-for="column in allColumns"
                :key="column.field"
                :disabled="column.required"
                @click="toggleColumn(column.field)"
              >
                <template #prepend>
                  <v-checkbox
                    :model-value="column.visible"
                    :disabled="column.required"
                    hide-details
                    @click.stop="toggleColumn(column.field)"
                  />
                </template>
                <v-list-item-title>{{ column.title }}</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>

          <v-btn
            variant="text"
            icon="mdi-refresh"
            :loading="chargePointsStore.loading"
            @click="refreshData"
          />
        </div>

        <v-alert
          v-if="chargePointsStore.error"
          type="error"
          variant="tonal"
          closable
          class="error-alert"
          @click:close="chargePointsStore.clearError"
        >
          {{ chargePointsStore.error }}
        </v-alert>

        <v-alert
          v-if="showSuccessAlert"
          type="success"
          variant="tonal"
          closable
          class="success-alert"
          @click:close="showSuccessAlert = false"
        >
          {{ successMessage }}
        </v-alert>

        <div class="grid-container">
          <KendoLocalizationProvider :language="kendoLocale">
            <KendoIntlProvider :locale="kendoLocale.split('-')[0]">
              <Grid
                ref="kendoGrid"
                :key="gridKey"
                :data-items="result.data || []"
                :total="result.total || 0"
                :columns="columnsWithSelection"
                :style="{ height: '500px' }"
                :sortable="true"
                :pageable="pageableConfig"
                :groupable="true"
                :group="group"
                :take="take"
                :skip="skip"
                :reorderable="true"
                :loading="
                  chargePointsStore.loading ||
                  chargingProfilesStore.loading ||
                  connectorsStore.loading
                "
                :disabled="
                  chargePointsStore.loading ||
                  chargingProfilesStore.loading ||
                  connectorsStore.loading
                "
                :selected-field="selectedField"
                :filterable="false"
                class="chargepoints-grid"
                :filter="dataState.filter"
                :sort="dataState.sort"
                :detail="cellTemplate"
                :expand-field="'expanded'"
                @datastatechange="dataStateChange"
                @selectionchange="onSelectionChange"
                @headerselectionchange="onHeaderSelectionChange"
                @rowclick="onRowClick"
                @expandchange="expandChange"
                @columnreorder="columnReorder"
                  :loader="!result.data.length || chargePointsStore.loading"

              >
                <template #columnMenuTemplate="{ props }">
                  <ColumnMenu
                    :column="props.column"
                    :filterable="props.filterable"
                    :filter="props.filter"
                    :sortable="props.sortable"
                    :sort="props.sort"
                    :columns="columns"
                    @sortchange="(e) => props.onSortchange(e)"
                    @filterchange="(e) => props.onFilterchange(e)"
                    @closemenu="(e) => props.onClosemenu(e)"
                    @contentfocus="(e) => props.onContentfocus(e)"
                    @columnssubmit="onColumnsSubmit"
                  />
                </template>

                <template #detailTemplate="{ props }">
                  <ChargePointDetailView
                    :charge-point="props.dataItem"
                    @edit="openEditDialog"
                    @delete="confirmDelete"
                  />
                </template>

                <template #myTemplate="{ props }">
                  <div v-if="props.dataItem._loadingProfiles" class="loading-container">
                    <v-progress-circular indeterminate color="primary" size="24" />
                  </div>
                  <TabStrip
                    v-else
                    :selected="getRowTabState(props.dataItem.id)"
                    :tabs="tabs"
                    @select="(e) => onSelect(e, props.dataItem.id)"
                  >
                    <template #details>
                      <ChargePointDetailView
                        :charge-point="props.dataItem"
                        :full-view="true"
                        @edit="openEditDialog"
                        @delete="confirmDelete"
                      />
                    </template>
                    <template #site>
                      <div v-if="props.dataItem.site" class="site-details">
                        <div class="detail-row">
                          <span class="detail-label">{{ $t('sites.siteName') }}:</span>
                          <span class="detail-value">{{ props.dataItem.site.name }}</span>
                        </div>
                        <div class="detail-row">
                          <span class="detail-label">{{ $t('sites.address') }}:</span>
                          <span class="detail-value">{{ props.dataItem.site.address }}</span>
                        </div>
                        <div class="detail-row">
                          <span class="detail-label">{{ $t('sites.city') }}:</span>
                          <span class="detail-value">{{ props.dataItem.site.city }}</span>
                        </div>
                        <div class="detail-row">
                          <span class="detail-label">{{ $t('sites.country') }}:</span>
                          <span class="detail-value">{{ props.dataItem.site.country }}</span>
                        </div>
                      </div>
                      <div v-else class="no-data-message">
                        {{ $t('chargepoints.noSiteData') }}
                      </div>
                    </template>

                    <template #chargingprofiles>
                      <div class="charging-profiles-header">
                        <v-btn
                          size="small"
                          color="primary"
                          variant="elevated"
                          prepend-icon="mdi-plus"
                          @click="addChargingProfile(props.dataItem)"
                        >
                          {{ $t('chargingprofiles.addChargingProfile') }}
                        </v-btn>
                      </div>
                      <div
                        v-if="
                          props.dataItem._chargingProfiles &&
                          props.dataItem._chargingProfiles.length > 0
                        "
                      >
                        <Grid
                          :columns="chargingProfilesColumns"
                          :data-items="props.dataItem._chargingProfiles"
                          :sortable="true"
                          :sort="chargingProfilesSort"
                          :filterable="false"
                          :messages="messages"
                          @sortchange="chargingProfilesSortChangeHandler"
                        >
                          <template #chargingProfileActionTemplate="{ props: profileProps }">
                            <ActionCell
                              :data-item="profileProps.dataItem"
                              @actionselect="handleChargingProfileAction"
                            />
                          </template>
                        </Grid>
                      </div>
                      <div v-else class="no-data-message">
                        {{ $t('chargepoints.noChargingProfileData') }}
                      </div>
                    </template>
                    <template #connectors>
                      <div class="connectors-header">
                        <v-btn
                          size="small"
                          color="primary"
                          variant="elevated"
                          @click="addConnector(props.dataItem)"
                        >
                          {{ $t('connectors.addConnector') }}
                        </v-btn>
                      </div>
                      <div
                        v-if="props.dataItem._connectors && props.dataItem._connectors.length > 0"
                      >
                        <Grid
                          :columns="connectorsColumns"
                          :data-items="props.dataItem._connectors"
                          :sortable="true"
                          :sort="connectorsSort"
                          :filterable="false"
                          :messages="messages"
                          @sortchange="connectorsSortChangeHandler"
                        >
                          <template #connectorActionTemplate="{ props: connectorProps }">
                            <ActionCell
                              :data-item="connectorProps.dataItem"
                              @actionselect="handleConnectorActionInChargePoints"
                            />
                          </template>
                        </Grid>
                      </div>
                      <div v-else class="no-data-message">
                        {{ $t('chargepoints.noConnectorData') }}
                      </div>
                    </template>
                  </TabStrip>
                </template>

                <template #actionTemplate="{ props }">
                  <ActionCell :data-item="props.dataItem" @actionselect="handleRowAction" />
                </template>
              </Grid>
            </KendoIntlProvider>
          </KendoLocalizationProvider>

          <div v-if="selectedGridChargePoint" class="grid-row-actions">
            <v-chip class="selected-indicator" color="primary" variant="outlined">
              {{ $t('chargepoints.chargePoint') }}: {{ selectedGridChargePoint.ocpp_charge_box_id }}
            </v-chip>

            <div class="action-buttons">
              <v-btn
                size="small"
                variant="outlined"
                prepend-icon="mdi-pencil"
                @click="openEditDialog(selectedGridChargePoint)"
              >
                {{ $t('common.edit') }}
              </v-btn>

              <v-btn
                size="small"
                variant="outlined"
                color="error"
                prepend-icon="mdi-delete"
                @click="confirmDelete(selectedGridChargePoint)"
              >
                {{ $t('common.delete') }}
              </v-btn>
            </div>
          </div>
        </div>
      </v-card-text>
    </v-card>

    <v-dialog v-model="dialogOpen" max-width="600px" persistent>
      <v-card>
        <v-card-title>
          <span class="text-h6">{{
            isEditing ? $t('chargepoints.editChargePoint') : $t('chargepoints.createNewChargePoint')
          }}</span>
        </v-card-title>

        <v-card-text>
          <v-form ref="chargePointForm" v-model="formValid" @submit.prevent="saveChargePoint">
            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model="currentChargePoint.ocpp_charge_box_id"
                  :label="$t('chargepoints.ocppChargeBoxId')"
                  :placeholder="$t('forms.ocppChargeBoxIdPlaceholder')"
                  :rules="[rules.required, rules.ocppIdMinLength]"
                  variant="outlined"
                  required
                />
              </v-col>

              <v-col cols="12">
                <v-select
                  v-model="currentChargePoint.site_id"
                  :label="$t('chargepoints.site')"
                  :items="availableSites"
                  :rules="[rules.required]"
                  variant="outlined"
                  required
                  :no-data-text="$t('chargepoints.noSitesAvailable')"
                />
              </v-col>

              <v-col cols="6">
                <v-text-field
                  v-model="currentChargePoint.manufacturer"
                  :label="$t('chargepoints.manufacturer')"
                  :placeholder="$t('forms.manufacturerPlaceholder')"
                  :rules="[rules.required, rules.manufacturerMinLength]"
                  variant="outlined"
                  required
                />
              </v-col>

              <v-col cols="6">
                <v-text-field
                  v-model="currentChargePoint.model"
                  :label="$t('chargepoints.model')"
                  :placeholder="$t('forms.modelPlaceholder')"
                  :rules="[rules.required, rules.modelMinLength]"
                  variant="outlined"
                  required
                />
              </v-col>

              <v-col cols="6">
                <v-text-field
                  v-model="currentChargePoint.connector_count"
                  :label="$t('chargepoints.connectorCount')"
                  :placeholder="$t('forms.connectorCountPlaceholder')"
                  :rules="[rules.required, rules.connectorCountRange]"
                  variant="outlined"
                  type="number"
                  required
                />
              </v-col>

              <v-col cols="6">
                <v-select
                  v-model="currentChargePoint.status"
                  :label="$t('chargepoints.status')"
                  :items="statusOptions"
                  :rules="[rules.required]"
                  variant="outlined"
                  required
                />
              </v-col>

              <v-col cols="12">
                <v-textarea
                  v-model="currentChargePoint.note"
                  :label="$t('common.note')"
                  :placeholder="$t('forms.notePlaceholder')"
                  variant="outlined"
                  rows="3"
                />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="closeDialog">
            {{ $t('common.cancel') }}
          </v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            :loading="chargePointsStore.loading"
            :disabled="!formValid"
            @click="saveChargePoint"
          >
            {{ isEditing ? $t('common.update') : $t('common.create') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="deleteDialogOpen" max-width="500px">
      <v-card>
        <v-card-title class="text-h6">
          {{ $t('chargepoints.deleteChargePoint') }}
        </v-card-title>
        <v-card-text>
          {{
            $t('chargepoints.confirmDelete', { id: selectedChargePoint?.ocpp_charge_box_id || '' })
          }}
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="deleteDialogOpen = false">
            {{ $t('common.cancel') }}
          </v-btn>
          <v-btn
            color="error"
            variant="elevated"
            :loading="chargePointsStore.loading"
            @click="deleteChargePoint"
          >
            {{ $t('common.delete') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="detailDialogOpen" max-width="900px" persistent>
      <v-card v-if="viewedChargePoint" class="modern-detail-card">
        <v-card-title class="detail-card-header">
          <div class="header-content">
            <v-icon class="header-icon" size="28" color="primary"> mdi-ev-station </v-icon>
            <div class="header-text">
              <h2 class="header-title">
                {{ viewedChargePoint.ocpp_charge_box_id }}
              </h2>
            </div>
          </div>
          <v-btn
            icon
            variant="text"
            size="small"
            class="close-btn"
            @click="detailDialogOpen = false"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>

        <v-divider class="header-divider" />

        <v-card-text class="detail-content">
          <ChargePointDetailView :charge-point="viewedChargePoint" :full-view="true" />
        </v-card-text>

        <v-divider />

        <v-card-actions class="detail-actions">
          <v-spacer />
          <v-btn
            variant="outlined"
            color="error"
            prepend-icon="mdi-delete"
            class="action-btn"
            @click="confirmDelete(viewedChargePoint)"
          >
            {{ $t('common.delete') }}
          </v-btn>
          <v-btn
            variant="elevated"
            color="primary"
            prepend-icon="mdi-pencil"
            class="action-btn"
            @click="openEditDialog(viewedChargePoint)"
          >
            {{ $t('common.edit') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Charging Profile Form Dialog -->
    <v-dialog v-model="chargingProfileDialogOpen" max-width="800px" persistent>
      <v-card>
        <v-card-title>
          <span class="text-h6">{{
            isEditingChargingProfile
              ? $t('chargingprofiles.editChargingProfile')
              : $t('chargingprofiles.createNewChargingProfile')
          }}</span>
        </v-card-title>

        <v-card-text>
          <v-form
            ref="chargingProfileFormRef"
            v-model="chargingProfileFormValid"
            @submit.prevent="saveChargingProfileInChargePoints"
          >
            <v-row>
              <v-col cols="6">
                <v-text-field
                  v-model="currentChargingProfileInChargePoints.stack_level"
                  :label="$t('chargingprofiles.stackLevel')"
                  :placeholder="$t('forms.stackLevelPlaceholder')"
                  :rules="[chargingProfileRules.required, chargingProfileRules.stackLevelRange]"
                  variant="outlined"
                  type="number"
                  required
                />
              </v-col>

              <v-col cols="6">
                <v-select
                  v-model="currentChargingProfileInChargePoints.charging_profile_purpose"
                  :label="$t('chargingprofiles.purpose')"
                  :items="purposeOptions"
                  :rules="[chargingProfileRules.required]"
                  variant="outlined"
                  required
                />
              </v-col>

              <v-col cols="6">
                <v-select
                  v-model="currentChargingProfileInChargePoints.charging_profile_kind"
                  :label="$t('chargingprofiles.kind')"
                  :items="kindOptions"
                  :rules="[chargingProfileRules.required]"
                  variant="outlined"
                  required
                />
              </v-col>

              <v-col cols="6">
                <v-select
                  v-model="currentChargingProfileInChargePoints.recurrency_kind"
                  :label="$t('chargingprofiles.recurrencyKind')"
                  :items="recurrencyOptions"
                  variant="outlined"
                />
              </v-col>

              <v-col cols="6">
                <v-text-field
                  v-model="currentChargingProfileInChargePoints.min_charging_rate"
                  :label="$t('chargingprofiles.minChargingRate')"
                  :placeholder="$t('forms.minChargingRatePlaceholder')"
                  :rules="[chargingProfileRules.minChargingRateRange]"
                  variant="outlined"
                  type="number"
                  step="0.1"
                />
              </v-col>

              <v-col cols="6">
                <v-text-field
                  v-model="currentChargingProfileInChargePoints.valid_from"
                  :label="$t('chargingprofiles.validFrom')"
                  :rules="[chargingProfileRules.required]"
                  variant="outlined"
                  type="datetime-local"
                  required
                />
              </v-col>

              <v-col cols="6">
                <v-text-field
                  v-model="currentChargingProfileInChargePoints.valid_to"
                  :label="$t('chargingprofiles.validTo')"
                  :rules="[chargingProfileRules.required]"
                  variant="outlined"
                  type="datetime-local"
                  required
                />
              </v-col>

              <v-col cols="6">
                <v-text-field
                  v-model="currentChargingProfileInChargePoints.duration_in_seconds"
                  :label="$t('chargingprofiles.durationInSeconds')"
                  :placeholder="$t('forms.durationPlaceholder')"
                  :rules="[chargingProfileRules.durationRange]"
                  variant="outlined"
                  type="number"
                />
              </v-col>

              <v-col cols="6">
                <v-text-field
                  v-model="currentChargingProfileInChargePoints.start_schedule"
                  :label="$t('chargingprofiles.startSchedule')"
                  variant="outlined"
                  type="datetime-local"
                />
              </v-col>

              <v-col cols="12">
                <v-text-field
                  v-model="currentChargingProfileInChargePoints.description"
                  :label="$t('chargingprofiles.description')"
                  :placeholder="$t('forms.descriptionPlaceholder')"
                  variant="outlined"
                />
              </v-col>

              <v-col cols="12">
                <v-textarea
                  v-model="currentChargingProfileInChargePoints.note"
                  :label="$t('common.note')"
                  :placeholder="$t('forms.notePlaceholder')"
                  variant="outlined"
                  rows="3"
                />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="closeChargingProfileDialog">
            {{ $t('common.cancel') }}
          </v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            :loading="chargingProfilesStore.loading"
            :disabled="!chargingProfileFormValid"
            @click="saveChargingProfileInChargePoints"
          >
            {{ isEditingChargingProfile ? $t('common.update') : $t('common.create') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Charging Profile Delete Confirmation Dialog -->
    <ConfirmationDialog
      v-model="chargingProfileDeleteDialogOpen"
      :title="$t('chargingprofiles.deleteChargingProfile')"
      :message="
        $t('chargingprofiles.confirmDelete', { id: selectedChargingProfileForDelete?.id || '' })
      "
      :loading="chargingProfilesStore.loading"
      @confirm="deleteChargingProfileConfirmed"
      @cancel="chargingProfileDeleteDialogOpen = false"
    />

    <!-- Connector Form Dialog -->
    <v-dialog v-model="connectorDialogOpen" max-width="600px" persistent>
      <v-card>
        <v-card-title>
          <span class="text-h6">{{
            isEditingConnector
              ? $t('connectors.editConnector')
              : $t('connectors.createNewConnector')
          }}</span>
        </v-card-title>

        <v-card-text>
          <v-form
            ref="connectorFormRef"
            v-model="connectorFormValid"
            @submit.prevent="saveConnectorInChargePoints"
          >
            <v-row>
              <v-col cols="6">
                <v-text-field
                  v-model="currentConnectorInChargePoints.connector_number"
                  :label="$t('connectors.connectorNumber')"
                  :placeholder="$t('forms.connectorNumberPlaceholder')"
                  :rules="[connectorRules.required, connectorRules.connectorNumberRange]"
                  variant="outlined"
                  type="number"
                  required
                />
              </v-col>

              <v-col cols="6">
                <v-text-field
                  v-model="currentConnectorInChargePoints.type"
                  :label="$t('connectors.type')"
                  :placeholder="$t('forms.connectorTypePlaceholder')"
                  :rules="[connectorRules.required, connectorRules.typeMinLength]"
                  variant="outlined"
                  required
                />
              </v-col>

              <v-col cols="6">
                <v-text-field
                  v-model="currentConnectorInChargePoints.max_power_kw"
                  :label="$t('connectors.maxPowerKw')"
                  :placeholder="$t('forms.maxPowerPlaceholder')"
                  :rules="[connectorRules.required, connectorRules.maxPowerRange]"
                  variant="outlined"
                  type="number"
                  step="0.1"
                  required
                />
              </v-col>

              <v-col cols="6">
                <v-select
                  v-model="currentConnectorInChargePoints.status"
                  :label="$t('connectors.status')"
                  :items="connectorStatusOptions"
                  :rules="[connectorRules.required]"
                  variant="outlined"
                  required
                />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="closeConnectorDialogInChargePoints">
            {{ $t('common.cancel') }}
          </v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            :loading="connectorsStore.loading"
            :disabled="!connectorFormValid"
            @click="saveConnectorInChargePoints"
          >
            {{ isEditingConnector ? $t('common.update') : $t('common.create') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Connector Delete Confirmation Dialog -->
    <ConfirmationDialog
      v-model="connectorDeleteDialogOpen"
      :title="$t('connectors.deleteConnector')"
      :message="$t('connectors.confirmDelete', { id: selectedConnectorForDelete?.id || '' })"
      :loading="connectorsStore.loading"
      @confirm="deleteConnectorConfirmed"
      @cancel="connectorDeleteDialogOpen = false"
    />

    <!-- Charging Profile Detail Dialog -->
    <v-dialog v-model="chargingProfileDetailDialogOpen" max-width="900px" persistent>
      <v-card v-if="viewedChargingProfileChild" class="modern-detail-card">
        <v-card-title class="detail-card-header">
          <div class="header-content">
            <v-icon class="header-icon" size="28" color="primary"> mdi-chart-line </v-icon>
            <div class="header-text">
              <h2 class="header-title">
                {{ $t('chargingprofiles.chargingProfile') }} {{ viewedChargingProfileChild.id }}
              </h2>
            </div>
          </div>
          <v-btn
            icon
            variant="text"
            size="small"
            class="close-btn"
            @click="chargingProfileDetailDialogOpen = false"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>

        <v-divider class="header-divider" />

        <v-card-text class="detail-content">
          <ChargingProfileDetailView
            :charging-profile="viewedChargingProfileChild"
            :full-view="true"
          />
        </v-card-text>

        <v-divider />

        <v-card-actions class="detail-actions">
          <v-spacer />
          <v-btn
            variant="outlined"
            color="error"
            prepend-icon="mdi-delete"
            class="action-btn"
            @click="deleteChargingProfile(viewedChargingProfileChild)"
          >
            {{ $t('common.delete') }}
          </v-btn>
          <v-btn
            variant="elevated"
            color="primary"
            prepend-icon="mdi-pencil"
            class="action-btn"
            @click="editChargingProfile(viewedChargingProfileChild)"
          >
            {{ $t('common.edit') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Connector Detail Dialog in ChargePoints -->
    <v-dialog v-model="connectorDetailDialogInChargePointsOpen" max-width="900px" persistent>
      <v-card v-if="viewedConnectorInChargePointsChild" class="modern-detail-card">
        <v-card-title class="detail-card-header">
          <div class="header-content">
            <v-icon class="header-icon" size="28" color="primary"> mdi-power-plug </v-icon>
            <div class="header-text">
              <h2 class="header-title">
                {{ $t('connectors.connector') }}
                {{ viewedConnectorInChargePointsChild.connector_number }}
              </h2>
            </div>
          </div>
          <v-btn
            icon
            variant="text"
            size="small"
            class="close-btn"
            @click="connectorDetailDialogInChargePointsOpen = false"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>

        <v-divider class="header-divider" />

        <v-card-text class="detail-content">
          <ConnectorDetailView :connector="viewedConnectorInChargePointsChild" :full-view="true" />
        </v-card-text>

        <v-divider />

        <v-card-actions class="detail-actions">
          <v-spacer />
          <v-btn
            variant="outlined"
            color="error"
            prepend-icon="mdi-delete"
            class="action-btn"
            @click="deleteConnector(viewedConnectorInChargePointsChild)"
          >
            {{ $t('common.delete') }}
          </v-btn>
          <v-btn
            variant="elevated"
            color="primary"
            prepend-icon="mdi-pencil"
            class="action-btn"
            @click="editConnector(viewedConnectorInChargePointsChild)"
          >
            {{ $t('common.edit') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <SelectionToolbar
      :selected-count="selectedCount"
      :loading="chargePointsStore.loading"
      @export-selected="exportSelectedChargePoints"
      @delete-selected="deleteSelectedChargePoints"
      @clear-selection="clearSelection"
    />
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck

import { ref, computed, onMounted, reactive, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Grid, filterGroupByField } from '@progress/kendo-vue-grid'
import { useKendoGridGlobalization } from '@/composables/useKendoGridGlobalization'
import { useChargePointsStore } from '@/stores/chargepoints'
import { useSitesStore } from '@/stores/sites'
import { useChargingProfilesStore } from '@/stores/chargingprofiles'
import { useConnectorsStore } from '@/stores/connectors'
import type {
  ChargePoint,
  CreateChargePointRequest,
  UpdateChargePointRequest
} from '@/types/chargepoints'
import { useKendoGridTranslations } from '@/composables/useKendoGridTranslations'
import { ExportUtils } from '@/utils/exportUtils'
import type { ExportColumn } from '@/utils/exportUtils'
import ColumnMenu from '@/components/columnMenu.vue'
import ChargePointDetailView from '@/components/ChargePointDetailView.vue'
import ChargingProfileDetailView from '@/components/ChargingProfileDetailView.vue'
import ConnectorDetailView from '@/components/ConnectorDetailView.vue'
import SelectionToolbar from '@/components/SelectionToolbar.vue'
import ActionCell from '@/components/ActionCell.vue'
import ConfirmationDialog from '@/components/ConfirmationDialog.vue'
import { process } from '@progress/kendo-data-query'
import '@/utils/resizeObserverFix'
import { TabStrip } from '@progress/kendo-vue-layout'
import { formatDateTime } from '@/utils/dateUtils'
import { VChip } from 'vuetify/components'

const { t, locale } = useI18n()
const { kendoLocale, KendoLocalizationProvider, KendoIntlProvider } = useKendoGridGlobalization()

// Grid messages are now handled by the globalization composable
const chargePointsStore = useChargePointsStore()
const sitesStore = useSitesStore()
const selected = ref(0)
const rowTabStates = ref(new Map())
const chargingProfilesStore = useChargingProfilesStore()
const connectorsStore = useConnectorsStore()
const selectedField = 'selected'
const cellTemplate = ref('myTemplate')
const viewedChargePoint = ref<ChargePoint | null>(null)
const detailDialogOpen = ref(false)
const dialogOpen = ref(false)
const deleteDialogOpen = ref(false)
const formValid = ref(false)
const isEditing = ref(false)
const selectedChargePoint = ref<ChargePoint | null>(null)
const selectedGridChargePoint = ref<ChargePoint | null>(null)
const chargePointForm = ref()

// Charging Profile dialog state
const chargingProfileDialogOpen = ref(false)
const chargingProfileDeleteDialogOpen = ref(false)
const chargingProfileFormValid = ref(false)
const isEditingChargingProfile = ref(false)
const selectedChargingProfileForDelete = ref<any>(null)
const selectedChargingProfileForEdit = ref<any>(null)
const selectedChargePointForProfile = ref<any>(null)
const chargingProfileFormRef = ref()

// Connector dialog state
const connectorDialogOpen = ref(false)
const connectorDeleteDialogOpen = ref(false)
const connectorFormValid = ref(false)
const isEditingConnector = ref(false)
const selectedConnectorForDelete = ref<any>(null)
const selectedConnectorForEdit = ref<any>(null)
const selectedChargePointForConnector = ref<any>(null)
const connectorFormRef = ref()

const kendoGrid = ref()
const group = ref([])
const result = ref([])
const gridKey = ref(0)
const globalSearch = ref('')
const successMessage = ref('')
const showSuccessAlert = ref(false)
const forceGridRefresh = () => gridKey.value++

const dataState = ref({
  take: 8,
  skip: 0
})
const skip = ref(0)
const take = ref(10)
const chargingProfilesSort = ref([])
const connectorsSort = ref([])

// Child detail dialogs
const chargingProfileDetailDialogOpen = ref(false)
const viewedChargingProfileChild = ref<any>(null)
const connectorDetailDialogInChargePointsOpen = ref(false)
const viewedConnectorInChargePointsChild = ref<any>(null)

const chargingProfilesSortChangeHandler = (e) => {
  chargingProfilesSort.value = e.sort
}

const connectorsSortChangeHandler = (e) => {
  connectorsSort.value = e.sort
}

const currentChargePoint = reactive<Partial<ChargePoint>>({
  ocpp_charge_box_id: '',
  site_id: undefined,
  manufacturer: '',
  model: '',
  connector_count: undefined,
  status: 'active',
  note: ''
})

const currentChargingProfileInChargePoints = reactive<any>({
  charge_point_id: undefined,
  stack_level: 0,
  charging_profile_purpose: 'TxDefault',
  charging_profile_kind: 'Absolute',
  recurrency_kind: undefined,
  valid_from: '',
  valid_to: '',
  duration_in_seconds: undefined,
  start_schedule: undefined,
  min_charging_rate: undefined,
  description: '',
  note: ''
})

const currentConnectorInChargePoints = reactive<any>({
  charge_point_id: undefined,
  connector_number: undefined,
  type: '',
  max_power_kw: undefined,
  status: 'available'
})

const chargePoints = computed(() => chargePointsStore.chargePoints)

const selectedChargePoints = computed(() => chargePoints.value.filter((cp) => cp.selected === true))

const selectedCount = computed(() => selectedChargePoints.value.length)

const filteredChargePoints = computed(() => {
  if (!globalSearch.value) {
    return chargePoints.value
  }

  const searchTerm = globalSearch.value.toLowerCase()
  return chargePoints.value.filter(
    (cp) =>
      cp.ocpp_charge_box_id?.toLowerCase().includes(searchTerm) ||
      cp.manufacturer?.toLowerCase().includes(searchTerm) ||
      cp.model?.toLowerCase().includes(searchTerm) ||
      cp.status?.toLowerCase().includes(searchTerm) ||
      cp.site_id?.toString().includes(searchTerm)
  )
})

const pageableConfig = {
  buttonCount: 5,
  pageSizes: [10, 20, 50, 100],
  pageSize: 20
}

const tabs = ref([
  { title: t('chargepoints.details'), content: 'details' },
  { title: t('sites.locationDetails'), content: 'site' },
  { title: t('connectors.title'), content: 'connectors' },
  { title: t('chargingprofiles.title'), content: 'chargingprofiles' }
])

const statusOptions = [
  { value: 'active', title: t('chargepoints.statusActive') },
  { value: 'inactive', title: t('chargepoints.statusInactive') },
  { value: 'faulty', title: t('chargepoints.statusFaulty') }
]

const purposeOptions = [
  { value: 'TxDefault', title: 'Tx Default' },
  { value: 'TxProfile', title: 'Tx Profile' },
  { value: 'TxMaxProfile', title: 'Tx Max Profile' }
]

const kindOptions = [
  { value: 'Absolute', title: t('chargingprofiles.kindAbsolute') },
  { value: 'Recurring', title: t('chargingprofiles.kindRecurring') },
  { value: 'Relative', title: t('chargingprofiles.kindRelative') }
]

const recurrencyOptions = [
  { value: 'Daily', title: t('chargingprofiles.recurrencyDaily') },
  { value: 'Weekly', title: t('chargingprofiles.recurrencyWeekly') }
]

const connectorStatusOptions = [
  { value: 'available', title: t('connectors.statusAvailable') },
  { value: 'occupied', title: t('connectors.statusOccupied') },
  { value: 'faulted', title: t('connectors.statusFaulted') },
  { value: 'unavailable', title: t('connectors.statusUnavailable') }
]

const availableSites = computed(() =>
  sitesStore.sites.map((site) => ({
    value: site.site_id,
    title: `${site.name} (${site.city})`
  }))
)
const connectorsColumns = [
  {
    field: 'connector_number',
    title: t('connectors.connectorNumber')
  },
  {
    field: 'type',
    title: t('connectors.type')
  },
  {
    field: 'max_power_kw',
    title: t('connectors.maxPowerKw'),
    headerClassName: 'customMenu'
  },
  {
    field: 'status',
    title: t('connectors.status'),
    cell: (h, td, props) => {
      const status = props.dataItem.status
      return h(
        VChip,
        {
          size: 'small',
          color: getConnectorStatusColor(status),
          variant: 'tonal'
        },
        () => t(`connectors.status${status.charAt(0).toUpperCase() + status.slice(1)}`)
      )
    }
  },
  {
    title: t('common.actions'),
    cell: 'connectorActionTemplate',
    width: '120px'
  }
]
const chargePointsColumns = [
  {
    field: 'ocpp_charge_box_id',
    title: t('chargepoints.ocppChargeBoxId'),
    filter: 'text',
    filterable: false
  },
  {
    field: 'manufacturer',
    title: t('chargepoints.manufacturer'),
    filter: 'text',
    filterable: false
  },
  {
    field: 'model',
    title: t('chargepoints.model'),
    filter: 'text',
    filterable: false
  },
  {
    field: 'connector_count',
    title: t('chargepoints.connectorCount'),
    filter: 'numeric',
    filterable: false
  },
  {
    field: 'status',
    title: t('chargepoints.status'),
    filter: 'text',
    filterable: false
  }
]

const chargingProfilesColumns = [
  {
    field: 'stack_level',
    title: t('chargingprofiles.stackLevel')
  },
  {
    field: 'charging_profile_purpose',
    title: t('chargingprofiles.purpose')
  },
  {
    field: 'charging_profile_kind',
    title: t('chargingprofiles.kind')
  },
  {
    field: 'valid_from',
    title: t('chargingprofiles.validFrom'),
    cell: (h, td, props) => {
      const userLocale = navigator.language || 'en-US'
      return h('td', {}, formatDateTime(props.dataItem.valid_from, userLocale))
    }
  },
  {
    field: 'valid_to',
    title: t('chargingprofiles.validTo'),
    cell: (h, td, props) => {
      const userLocale = navigator.language || 'en-US'
      return h('td', {}, formatDateTime(props.dataItem.valid_to, userLocale))
    }
  },
  {
    title: t('common.actions'),
    cell: 'chargingProfileActionTemplate',
    width: '120px'
  }
]

// All available columns with visibility control
const allColumns = ref([
  {
    field: 'id',
    title: t('chargepoints.id'),
    filter: 'numeric',
    columnMenu: 'columnMenuTemplate',
    headerClassName: 'customMenu',
    visible: true,
  },
  {
    field: 'ocpp_charge_box_id',
    title: t('chargepoints.ocppChargeBoxId'),
    filter: 'text',
    columnMenu: 'columnMenuTemplate',
    headerClassName: 'customMenu',
    visible: true,
    required: true,
  },
  {
    field: 'site_id',
    title: t('chargepoints.siteId'),
    filter: 'numeric',
    columnMenu: 'columnMenuTemplate',
    headerClassName: 'customMenu',
    visible: false,
  },
  {
    field: 'site.name',
    title: t('sites.siteName'),
    filter: 'text',
    columnMenu: 'columnMenuTemplate',
    headerClassName: 'customMenu',
    visible: true,
  },
  {
    field: 'manufacturer',
    title: t('chargepoints.manufacturer'),
    filter: 'text',
    columnMenu: 'columnMenuTemplate',
    headerClassName: 'customMenu',
    visible: true,
  },
  {
    field: 'model',
    title: t('chargepoints.model'),
    filter: 'text',
    columnMenu: 'columnMenuTemplate',
    headerClassName: 'customMenu',
    visible: false
  },
  {
    field: 'connector_count',
    title: t('chargepoints.connectorCount'),
    filter: 'numeric',
    columnMenu: 'columnMenuTemplate',
    headerClassName: 'customMenu',
    visible: false
  },
  {
    field: 'status',
    title: t('chargePoints.status'),
    filter: 'text',
    columnMenu: 'columnMenuTemplate',
    headerClassName: 'customMenu',
    visible: true,
    cell: (h, td, props) => {
      const status = props.dataItem.status
      const translationKey = `status${status}`
      if(!translationKey.includes('undefined') || status !== undefined){
         return h(
        VChip,
        {
          size: 'small',
          color: getStatusColor(status),
          variant: 'tonal'
        },
        () => t(`chargePoints.${translationKey}`)
      )
      }
    }
  },
  {
    field: 'created_at',
    title: t('common.created'),
    filter: 'date',
    columnMenu: 'columnMenuTemplate',
    headerClassName: 'customMenu',
    visible: false,
    cell: (h, td, props) => {
      const userLocale = navigator.language || 'en-US'
      return h('td', {}, formatDateTime(props.dataItem.created_at, userLocale))
    }
  },
  { title: t('common.actions'), cell: 'actionTemplate', width: '120px', visible: true }
])

// Default visible columns
const defaultVisibleColumns = [
  'ocpp_charge_box_id',
  'site_id',
  'manufacturer',
  'model',
  'connector_count',
  'status'
]
const getStatusColor = (status: string) => {
  switch (status) {
    case 'active':
      return 'success'
    case 'inactive':
      return 'warning'
    case 'faulty':
      return 'error'
    default:
      return 'default'
  }
}

const getConnectorStatusColor = (status: string) => {
  switch (status) {
    case 'available':
      return 'success'
    case 'occupied':
      return 'info'
    case 'faulted':
      return 'error'
    case 'unavailable':
      return 'warning'
    default:
      return 'default'
  }
}
// Computed visible columns
const staticColumns = computed(() => {
  return allColumns.value.filter((col) => col.visible)
})

const areAllSelected = computed(
  () => filteredChargePoints.value.findIndex((item) => item.selected === false) === -1
)

const columns = computed(() => staticColumns.value)

const columnsWithSelection = computed(() => [
  { field: 'selected', width: '50px', headerSelectionValue: areAllSelected.value },
  ...columns.value
])

// Function to toggle column visibility
const toggleColumn = (field: string) => {
  const column = allColumns.value.find((col) => col.field === field)
  if (column && !column.required) {
    column.visible = !column.visible
  }
}

const onColumnsSubmit = (columnsState: any[]) => {
  // Update the visible columns based on the column menu state
  const visibleFields = columnsState.map((col) => col.field)
  allColumns.value = allColumns.value.map((col) => ({
    ...col,
    visible: visibleFields.includes(col.field)
  }))
}

const rules = {
  required: (value: string | number) =>
    (value !== null && value !== undefined && value !== '') || t('validation.fieldRequired'),
  ocppIdMinLength: (value: string) =>
    value.length >= 3 || t('chargepoints.validation.ocppIdMinLength'),
  siteIdNumeric: (value: number) =>
    (!isNaN(value) && value > 0) || t('chargepoints.validation.siteIdNumeric'),
  manufacturerMinLength: (value: string) =>
    value.length >= 2 || t('chargepoints.validation.manufacturerMinLength'),
  modelMinLength: (value: string) =>
    value.length >= 2 || t('chargepoints.validation.modelMinLength'),
  connectorCountRange: (value: number) =>
    (value >= 1 && value <= 10) || t('chargepoints.validation.connectorCountRange')
}

const chargingProfileRules = {
  required: (value: string | number) =>
    (value !== null && value !== undefined && value !== '') || t('validation.fieldRequired'),
  stackLevelRange: (value: number) =>
    (value >= 0 && value <= 99) || t('chargingprofiles.validation.stackLevelRange'),
  minChargingRateRange: (value: number) =>
    !value || (value > 0 && value <= 1000) || t('chargingprofiles.validation.minChargingRateRange'),
  durationRange: (value: number) =>
    !value || (value > 0 && value <= 86400) || t('chargingprofiles.validation.durationRange')
}

const connectorRules = {
  required: (value: string | number) =>
    (value !== null && value !== undefined && value !== '') || t('validation.fieldRequired'),
  connectorNumberRange: (value: number) =>
    (value >= 1 && value <= 10) || t('connectors.validation.connectorNumberRange'),
  typeMinLength: (value: string) => value.length >= 2 || t('connectors.validation.typeMinLength'),
  maxPowerRange: (value: number) =>
    (value > 0 && value <= 1000) || t('connectors.validation.maxPowerRange')
}



function handleRowAction({ dataItem, action }) {
  switch (action) {
    case 'view':
      viewChargePoint(dataItem)
      break
    case 'update':
      openEditDialog(dataItem)
      break
    case 'delete':
      confirmDelete(dataItem)
      break
  }
}

function handleChargingProfileAction({ dataItem, action }) {
  switch (action) {
    case 'view':
      viewedChargingProfileChild.value = dataItem
      chargingProfileDetailDialogOpen.value = true
      break
    case 'update':
      editChargingProfile(dataItem)
      break
    case 'delete':
      deleteChargingProfile(dataItem)
      break
  }
}

function handleConnectorActionInChargePoints({ dataItem, action }) {
  switch (action) {
    case 'view':
      viewedConnectorInChargePointsChild.value = dataItem
      connectorDetailDialogInChargePointsOpen.value = true
      break
    case 'update':
      editConnector(dataItem)
      break
    case 'delete':
      deleteConnector(dataItem)
      break
  }
}

function createAppState(dataState) {
  group.value = dataState.group
  take.value = dataState.take
  skip.value = dataState.skip
  refreshData()
}

const columnReorder = (options: any) => {
  // Handle column reordering while maintaining visibility state
  const newColumnOrder = options.columns.filter((col: any) => col.field !== 'selected')
  const reorderedColumns = newColumnOrder.map((newCol: any) => {
    const existingCol = allColumns.value.find((col) => col.field === newCol.field)
    return existingCol ? { ...existingCol, ...newCol } : newCol
  })

  // Update allColumns with new order
  allColumns.value = reorderedColumns
}

async function expandChange(event) {
  event.dataItem[event.target.$props.expandField] = event.value

  // Fetch charging profiles and connectors when expanding a charge point
  if (event.value && event.dataItem.id) {
    // Set loading state
    event.dataItem._loadingProfiles = true
    try {
      // Fetch charging profiles and connectors in parallel
      const [profiles, connectors] = await Promise.all([
        chargingProfilesStore.fetchChargingProfilesByChargePointId(event.dataItem.id),
        connectorsStore.getConnectorsByChargePointId(event.dataItem.id)
      ])

      // Store data in the specific row's data item
      event.dataItem._chargingProfiles = profiles
      event.dataItem._connectors = connectors
    } catch (error) {
      console.error('Error fetching related data:', error)
      event.dataItem._chargingProfiles = []
      event.dataItem._connectors = []
    } finally {
      event.dataItem._loadingProfiles = false
    }
  } else if (!event.value) {
    // Clear data when collapsing
    event.dataItem._chargingProfiles = []
    event.dataItem._connectors = []
    event.dataItem._loadingProfiles = false
    // Clear tab state for this row
    rowTabStates.value.delete(event.dataItem.id)
  }
}

const createDataState = (state) => {
  if (filteredChargePoints.value && filteredChargePoints.value.length > 0) {
    result.value = process(filteredChargePoints.value.slice(0), state)
  } else {
    result.value = { data: [], total: 0 }
  }
  dataState.value = state
}

const dataStateChange = (e) => {
  if (e.event) {
    const isColumnActive = filterGroupByField(e.event.field, e.data.filter)
    const changedColumn = columns.value.find((column) => column.field === e.event.field)

    if (changedColumn) {
      changedColumn.headerClassName = isColumnActive ? 'customMenu active' : ''
    }
    // createAppState(e.data)
  }
  createDataState(e.data)
}

const refreshData = async () => {
  await Promise.all([
    chargePointsStore.fetchChargePoints(),
    sitesStore.fetchSites(),
    connectorsStore.fetchConnectors()
  ])
  chargePointsStore.chargePoints.forEach((cp) => {
    if (!cp.hasOwnProperty('selected')) {
      cp.selected = false
    }
  })
}
const onSelect = (e, rowId) => {
  if (rowId) {
    rowTabStates.value.set(rowId, e.selected)
  } else {
    selected.value = e.selected
  }
}

const getRowTabState = (rowId) => {
  return rowTabStates.value.get(rowId) || 0
}

const openCreateDialog = () => {
  isEditing.value = false
  resetForm()
  dialogOpen.value = true
}

const viewChargePoint = (chargePoint: ChargePoint) => {
  viewedChargePoint.value = chargePoint
  detailDialogOpen.value = true
}

const openEditDialog = (chargePoint: ChargePoint) => {
  isEditing.value = true
  Object.assign(currentChargePoint, chargePoint)
  dialogOpen.value = true
}

const closeDialog = () => {
  dialogOpen.value = false
  resetForm()
}

const resetForm = () => {
  Object.assign(currentChargePoint, {
    ocpp_charge_box_id: '',
    site_id: undefined,
    manufacturer: '',
    model: '',
    connector_count: undefined,
    status: 'active',
    note: ''
  })
  if (chargePointForm.value) {
    chargePointForm.value.resetValidation()
  }
}

const saveChargePoint = async () => {
  if (!chargePointForm.value?.validate()) return

  const chargePointData = {
    ocpp_charge_box_id: currentChargePoint.ocpp_charge_box_id!,
    site_id: Number(currentChargePoint.site_id!),
    manufacturer: currentChargePoint.manufacturer!,
    model: currentChargePoint.model!,
    connector_count: Number(currentChargePoint.connector_count!),
    status: currentChargePoint.status! as 'active' | 'inactive' | 'faulty',
    note: currentChargePoint.note || ''
  }

  let success = false

  if (isEditing.value && currentChargePoint.id) {
    const updateData: UpdateChargePointRequest = {
      ...chargePointData,
      id: currentChargePoint.id
    }
    success = await chargePointsStore.updateChargePoint(updateData)
    if (success) {
      successMessage.value = t('chargepoints.updated', {
        id: currentChargePoint.ocpp_charge_box_id
      })
      showSuccessAlert.value = true
      setTimeout(() => {
        showSuccessAlert.value = false
      }, 5000)
    }
  } else {
    const createData: CreateChargePointRequest = chargePointData
    success = await chargePointsStore.createChargePoint(createData)
    if (success) {
      successMessage.value = t('chargepoints.created', { id: chargePointData.ocpp_charge_box_id })
      showSuccessAlert.value = true
      setTimeout(() => {
        showSuccessAlert.value = false
      }, 5000)
    }
  }

  if (success) {
    closeDialog()
    detailDialogOpen.value = false
    viewedChargePoint.value = null
  }
}

const confirmDelete = (chargePoint: ChargePoint) => {
  selectedChargePoint.value = chargePoint
  deleteDialogOpen.value = true
}

const deleteChargePoint = async () => {
  if (selectedChargePoint.value?.id) {
    const chargePointId = selectedChargePoint.value.ocpp_charge_box_id
    const success = await chargePointsStore.deleteChargePoint(selectedChargePoint.value.id)
    if (success) {
      successMessage.value = t('chargepoints.deleted', { id: chargePointId })
      showSuccessAlert.value = true
      setTimeout(() => {
        showSuccessAlert.value = false
      }, 5000)
      deleteDialogOpen.value = false
      detailDialogOpen.value = false
      selectedChargePoint.value = null
      selectedGridChargePoint.value = null
      viewedChargePoint.value = null
      refreshData()
    }
  }
}

const clearSelection = () => {
  chargePointsStore.chargePoints = chargePointsStore.chargePoints.map((item) => ({
    ...item,
    selected: false
  }))
}

const deleteSelectedChargePoints = async () => {
  const selectedIds = selectedChargePoints.value.map((cp) => cp.id).filter((id) => id !== undefined)

  if (selectedIds.length === 0) return

  let allSuccess = true
  for (const id of selectedIds) {
    const success = await chargePointsStore.deleteChargePoint(id!)
    if (!success) allSuccess = false
  }

  if (allSuccess) {
    clearSelection()
    refreshData()
  }
}

const exportSelectedChargePoints = async (format: 'pdf' | 'excel' | 'csv') => {
  try {
    const columns: ExportColumn[] = [
      { key: 'id', title: t('chargepoints.id'), type: 'number' },
      { key: 'ocpp_charge_box_id', title: t('chargepoints.ocppChargeBoxId'), type: 'text' },
      { key: 'site_id', title: t('chargepoints.siteId'), type: 'number' },
      { key: 'manufacturer', title: t('chargepoints.manufacturer'), type: 'text' },
      { key: 'model', title: t('chargepoints.model'), type: 'text' },
      { key: 'connector_count', title: t('chargepoints.connectorCount'), type: 'number' },
      { key: 'status', title: t('chargepoints.status'), type: 'text' },
      { key: 'created_at', title: t('common.created'), type: 'date' }
    ]

    const exportOptions = {
      data: selectedChargePoints.value,
      columns,
      title: t('chargepoints.selectedChargePoints'),
      filename: `selected_chargepoints_${new Date().toISOString().split('T')[0]}`
    }

    switch (format) {
      case 'pdf':
        await ExportUtils.exportToPDF({
          ...exportOptions,
          filename: exportOptions.filename + '.pdf'
        })
        break
      case 'excel':
        await ExportUtils.exportToExcel({
          ...exportOptions,
          filename: exportOptions.filename + '.xlsx'
        })
        break
      case 'csv':
        await ExportUtils.exportToCSV({
          ...exportOptions,
          filename: exportOptions.filename + '.csv'
        })
        break
    }
  } catch (error) {
    console.error('Selected export error:', error)
  }
}

function onHeaderSelectionChange(event) {
  const checked = event.event.target.checked
  chargePointsStore.chargePoints = chargePointsStore.chargePoints.map((item) => ({
    ...item,
    selected: checked
  }))
}
function onSelectionChange(event) {
  event.dataItem[selectedField] = !event.dataItem[selectedField]
}

function onRowClick(event) {
  // const nativeEvent = event.event;
  // let target = nativeEvent?.target;
  // if (!target) return;
  // while (target && target.nodeType !== 1) {
  //   target = target.parentNode;
  // }
  // const isHierarchyClick =
  //   target.closest('.k-hierarchy-cell') || target.closest('.k-i-expand') || target.closest('.k-icon');
  // const isActionClick = target.closest('.action-column') || target.closest('button') || target.closest('input[type="checkbox"]');
  // if (isHierarchyClick || isActionClick) {
  //   return;
  // }
  // if (event.dataItem && !event.dataItem.aggregates) {
  //   viewChargePoint(event.dataItem)
  // }
}

const exportToPdf = async () => {
  try {
    const columns: ExportColumn[] = [
      { key: 'id', title: t('chargepoints.id'), type: 'number' },
      { key: 'ocpp_charge_box_id', title: t('chargepoints.ocppChargeBoxId'), type: 'text' },
      { key: 'site_id', title: t('chargepoints.siteId'), type: 'number' },
      { key: 'manufacturer', title: t('chargepoints.manufacturer'), type: 'text' },
      { key: 'model', title: t('chargepoints.model'), type: 'text' },
      { key: 'connector_count', title: t('chargepoints.connectorCount'), type: 'number' },
      { key: 'status', title: t('chargepoints.status'), type: 'text' },
      { key: 'created_at', title: t('common.created'), type: 'date' }
    ]

    await ExportUtils.exportToPDF({
      data: filteredChargePoints.value,
      columns,
      title: t('chargepoints.title'),
      filename: `chargepoints_${new Date().toISOString().split('T')[0]}.pdf`
    })
  } catch (error) {
    console.error('PDF export error:', error)
  }
}

const exportToExcel = async () => {
  try {
    const columns: ExportColumn[] = [
      { key: 'id', title: t('chargepoints.id'), type: 'number' },
      { key: 'ocpp_charge_box_id', title: t('chargepoints.ocppChargeBoxId'), type: 'text' },
      { key: 'site_id', title: t('chargepoints.siteId'), type: 'number' },
      { key: 'manufacturer', title: t('chargepoints.manufacturer'), type: 'text' },
      { key: 'model', title: t('chargepoints.model'), type: 'text' },
      { key: 'connector_count', title: t('chargepoints.connectorCount'), type: 'number' },
      { key: 'status', title: t('chargepoints.status'), type: 'text' },
      { key: 'created_at', title: t('common.created'), type: 'date' }
    ]

    await ExportUtils.exportToExcel({
      data: filteredChargePoints.value,
      columns,
      title: t('chargepoints.title'),
      filename: `chargepoints_${new Date().toISOString().split('T')[0]}.xlsx`
    })
  } catch (error) {
    console.error('Excel export error:', error)
  }
}

const exportToCsv = async () => {
  try {
    const columns: ExportColumn[] = [
      { key: 'id', title: t('chargepoints.id'), type: 'number' },
      { key: 'ocpp_charge_box_id', title: t('chargepoints.ocppChargeBoxId'), type: 'text' },
      { key: 'site_id', title: t('chargepoints.siteId'), type: 'number' },
      { key: 'manufacturer', title: t('chargepoints.manufacturer'), type: 'text' },
      { key: 'model', title: t('chargepoints.model'), type: 'text' },
      { key: 'connector_count', title: t('chargepoints.connectorCount'), type: 'number' },
      { key: 'status', title: t('chargepoints.status'), type: 'text' },
      { key: 'created_at', title: t('common.created'), type: 'date' }
    ]

    await ExportUtils.exportToCSV({
      data: filteredChargePoints.value,
      columns,
      title: t('chargepoints.title'),
      filename: `chargepoints_${new Date().toISOString().split('T')[0]}.csv`
    })
  } catch (error) {
    console.error('CSV export error:', error)
  }
}

onMounted(() => {
  createDataState({
    take: 8,
    skip: 0
  })
})

onMounted(async () => {
  await refreshData()
  createDataState({
    take: 8,
    skip: 0
  })
})

watch(
  filteredChargePoints,
  (newValue) => {
    // Reset pagination when filtered data changes
    const newDataState = {
      ...dataState.value,
      skip: 0
    }
    createDataState(newDataState)
  },
  { immediate: true }
)

watch(globalSearch, () => {
  // Reset pagination when search changes
  const newDataState = {
    ...dataState.value,
    skip: 0
  }
  createDataState(newDataState)
})

// Charging Profile Management Functions
const addChargingProfile = (chargePoint: ChargePoint) => {
  resetChargingProfileForm()
  selectedChargePointForProfile.value = chargePoint
  currentChargingProfileInChargePoints.charge_point_id = chargePoint.id
  isEditingChargingProfile.value = false
  chargingProfileDialogOpen.value = true
}

const editChargingProfile = (chargingProfile: any) => {
  selectedChargingProfileForEdit.value = chargingProfile
  isEditingChargingProfile.value = true
  Object.assign(currentChargingProfileInChargePoints, {
    ...chargingProfile,
    // Convert dates to datetime-local format for inputs
    valid_from: chargingProfile.valid_from
      ? new Date(chargingProfile.valid_from).toISOString().slice(0, 16)
      : '',
    valid_to: chargingProfile.valid_to
      ? new Date(chargingProfile.valid_to).toISOString().slice(0, 16)
      : '',
    start_schedule: chargingProfile.start_schedule
      ? new Date(chargingProfile.start_schedule).toISOString().slice(0, 16)
      : ''
  })
  chargingProfileDialogOpen.value = true
}

const closeChargingProfileDialog = () => {
  chargingProfileDialogOpen.value = false
  resetChargingProfileForm()
}

const resetChargingProfileForm = () => {
  Object.assign(currentChargingProfileInChargePoints, {
    charge_point_id: undefined,
    stack_level: 0,
    charging_profile_purpose: 'TxDefault',
    charging_profile_kind: 'Absolute',
    recurrency_kind: undefined,
    valid_from: '',
    valid_to: '',
    duration_in_seconds: undefined,
    start_schedule: undefined,
    min_charging_rate: undefined,
    description: '',
    note: ''
  })
  if (chargingProfileFormRef.value) {
    chargingProfileFormRef.value.resetValidation()
  }
}

const saveChargingProfileInChargePoints = async () => {
  if (!chargingProfileFormRef.value?.validate()) return

  const profileData = {
    charge_point_id: Number(currentChargingProfileInChargePoints.charge_point_id!),
    stack_level: Number(currentChargingProfileInChargePoints.stack_level!),
    charging_profile_purpose: currentChargingProfileInChargePoints.charging_profile_purpose! as
      | 'TxDefault'
      | 'TxProfile'
      | 'TxMaxProfile',
    charging_profile_kind: currentChargingProfileInChargePoints.charging_profile_kind! as
      | 'Absolute'
      | 'Recurring'
      | 'Relative',
    recurrency_kind: currentChargingProfileInChargePoints.recurrency_kind as
      | 'Daily'
      | 'Weekly'
      | undefined,
    valid_from: new Date(currentChargingProfileInChargePoints.valid_from!),
    valid_to: new Date(currentChargingProfileInChargePoints.valid_to!),
    duration_in_seconds: currentChargingProfileInChargePoints.duration_in_seconds
      ? Number(currentChargingProfileInChargePoints.duration_in_seconds)
      : undefined,
    start_schedule: currentChargingProfileInChargePoints.start_schedule
      ? new Date(currentChargingProfileInChargePoints.start_schedule)
      : undefined,
    min_charging_rate: currentChargingProfileInChargePoints.min_charging_rate
      ? Number(currentChargingProfileInChargePoints.min_charging_rate)
      : undefined,
    description: currentChargingProfileInChargePoints.description || '',
    note: currentChargingProfileInChargePoints.note || ''
  }

  let success = false

  if (isEditingChargingProfile.value && selectedChargingProfileForEdit.value?.id) {
    const updateData = {
      ...profileData,
      id: selectedChargingProfileForEdit.value.id
    }
    success = await chargingProfilesStore.updateChargingProfile(updateData)
    if (success) {
      successMessage.value = t('chargingprofiles.updated', {
        id: selectedChargingProfileForEdit.value.id
      })
      showSuccessAlert.value = true
      setTimeout(() => {
        showSuccessAlert.value = false
      }, 5000)
    }
  } else {
    success = await chargingProfilesStore.createChargingProfile(profileData)
    if (success) {
      successMessage.value = t('chargingprofiles.created')
      showSuccessAlert.value = true
      setTimeout(() => {
        showSuccessAlert.value = false
      }, 5000)
    }
  }

  if (success) {
    closeChargingProfileDialog()
    // Refresh the expanded row data
    if (selectedChargePointForProfile.value) {
      try {
        const profiles = await chargingProfilesStore.fetchChargingProfilesByChargePointId(
          selectedChargePointForProfile.value.id
        )
        selectedChargePointForProfile.value._chargingProfiles = profiles
      } catch (error) {
        console.error('Error refreshing charging profiles:', error)
      }
    }
    // Only refresh charging profiles data instead of entire grid
    await chargingProfilesStore.fetchChargingProfiles()
  }
}

const deleteChargingProfile = (chargingProfile: any) => {
  selectedChargingProfileForDelete.value = chargingProfile
  chargingProfileDeleteDialogOpen.value = true
}

const deleteChargingProfileConfirmed = async () => {
  if (selectedChargingProfileForDelete.value?.id) {
    try {
      const success = await chargingProfilesStore.deleteChargingProfile(
        selectedChargingProfileForDelete.value.id
      )
      if (success) {
        successMessage.value = t('chargingprofiles.deleted', {
          id: selectedChargingProfileForDelete.value.id
        })
        showSuccessAlert.value = true
        setTimeout(() => {
          showSuccessAlert.value = false
        }, 5000)
        chargingProfileDeleteDialogOpen.value = false

        // Refresh the expanded row data
        if (selectedChargePointForProfile.value) {
          try {
            const profiles = await chargingProfilesStore.fetchChargingProfilesByChargePointId(
              selectedChargePointForProfile.value.id
            )
            selectedChargePointForProfile.value._chargingProfiles = profiles
          } catch (error) {
            console.error('Error refreshing charging profiles:', error)
          }
        }

        selectedChargingProfileForDelete.value = null
        // Only refresh charging profiles data instead of entire grid
        await chargingProfilesStore.fetchChargingProfiles()
      } else {
        chargingProfileDeleteDialogOpen.value = false
      }
    } catch (error) {
      console.error('Error deleting charging profile:', error)
      chargingProfileDeleteDialogOpen.value = false
    }
  }
}

// Connector Management Functions
const addConnector = (chargePoint: ChargePoint) => {
  resetConnectorFormInChargePoints()
  selectedChargePointForConnector.value = chargePoint
  currentConnectorInChargePoints.charge_point_id = chargePoint.id
  isEditingConnector.value = false
  connectorDialogOpen.value = true
}

const editConnector = (connector: any) => {
  selectedConnectorForEdit.value = connector
  isEditingConnector.value = true
  Object.assign(currentConnectorInChargePoints, connector)
  connectorDialogOpen.value = true
}

const closeConnectorDialogInChargePoints = () => {
  connectorDialogOpen.value = false
  resetConnectorFormInChargePoints()
}

const resetConnectorFormInChargePoints = () => {
  Object.assign(currentConnectorInChargePoints, {
    charge_point_id: undefined,
    connector_number: undefined,
    type: '',
    max_power_kw: undefined,
    status: 'available'
  })
  if (connectorFormRef.value) {
    connectorFormRef.value.resetValidation()
  }
}

const saveConnectorInChargePoints = async () => {
  if (!connectorFormRef.value?.validate()) return

  const connectorData = {
    charge_point_id: Number(currentConnectorInChargePoints.charge_point_id!),
    connector_number: Number(currentConnectorInChargePoints.connector_number!),
    type: currentConnectorInChargePoints.type!,
    max_power_kw: Number(currentConnectorInChargePoints.max_power_kw!),
    status: currentConnectorInChargePoints.status! as
      | 'available'
      | 'occupied'
      | 'faulted'
      | 'unavailable'
  }

  let success = false

  if (isEditingConnector.value && selectedConnectorForEdit.value?.id) {
    const updateData = {
      ...connectorData,
      id: selectedConnectorForEdit.value.id
    }
    success = await connectorsStore.updateConnector(updateData)
    if (success) {
      successMessage.value = t('connectors.updated', { id: selectedConnectorForEdit.value.id })
      showSuccessAlert.value = true
      setTimeout(() => {
        showSuccessAlert.value = false
      }, 5000)
    }
  } else {
    success = await connectorsStore.createConnector(connectorData)
    if (success) {
      successMessage.value = t('connectors.created')
      showSuccessAlert.value = true
      setTimeout(() => {
        showSuccessAlert.value = false
      }, 5000)
    }
  }

  if (success) {
    closeConnectorDialogInChargePoints()
    // Refresh the expanded row data
    if (selectedChargePointForConnector.value) {
      try {
        const connectors = await connectorsStore.getConnectorsByChargePointId(
          selectedChargePointForConnector.value.id
        )
        selectedChargePointForConnector.value._connectors = connectors
      } catch (error) {
        console.error('Error refreshing connectors:', error)
      }
    }
    // Only refresh connectors data instead of entire grid
    await connectorsStore.fetchConnectors()
  }
}

const deleteConnector = (connector: any) => {
  selectedConnectorForDelete.value = connector
  connectorDeleteDialogOpen.value = true
}

const deleteConnectorConfirmed = async () => {
  if (selectedConnectorForDelete.value?.id) {
    try {
      const success = await connectorsStore.deleteConnector(selectedConnectorForDelete.value.id)
      if (success) {
        successMessage.value = t('connectors.deleted', { id: selectedConnectorForDelete.value.id })
        showSuccessAlert.value = true
        setTimeout(() => {
          showSuccessAlert.value = false
        }, 5000)
        connectorDeleteDialogOpen.value = false

        // Refresh the expanded row data
        if (selectedChargePointForConnector.value) {
          try {
            const connectors = await connectorsStore.getConnectorsByChargePointId(
              selectedChargePointForConnector.value.id
            )
            selectedChargePointForConnector.value._connectors = connectors
          } catch (error) {
            console.error('Error refreshing connectors:', error)
          }
        }

        selectedConnectorForDelete.value = null
        // Only refresh connectors data instead of entire grid
        await connectorsStore.fetchConnectors()
      } else {
        connectorDeleteDialogOpen.value = false
      }
    } catch (error) {
      console.error('Error deleting connector:', error)
      connectorDeleteDialogOpen.value = false
    }
  }
}
</script>

<style scoped>
.chargepoints-management {
  padding: 16px;
}

.chargepoints-header {
  padding: 24px 24px 16px 24px;
}

.action-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.export-actions {
  display: flex;
  gap: 8px;
}

.export-btn {
  font-size: 0.875rem;
}

.column-selector-btn {
  font-size: 0.875rem;
}

.error-alert,
.success-alert {
  margin-bottom: 16px;
}

.grid-container {
  margin-top: 16px;
}

.chargepoints-grid {
  border: 1px solid var(--v-border-color);
  border-radius: 4px;
}

.chargepoints-grid .k-grid-table tbody tr {
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.chargepoints-grid .k-grid-table tbody tr:hover {
  background-color: rgba(25, 118, 210, 0.04);
}

.grid-row-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 12px;
  padding: 12px;
  background-color: var(--v-theme-surface);
  border: 1px solid var(--v-border-color);
  border-radius: 4px;
}

.selected-indicator {
  margin-right: 16px;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.action-buttons-cell {
  display: flex;
  gap: 4px;
  justify-content: center;
  padding: 8px 0;
}

.action-btn {
  margin: 0 2px;
  transition: all 0.2s ease;
}

.search-container {
  min-width: 300px !important;
}

.action-btn:hover {
  transform: scale(1.1);
}

.action-btn .v-icon {
  font-size: 18px;
}

@media (max-width: 768px) {
  .action-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .export-actions {
    justify-content: center;
  }

  .export-btn {
    flex: 1;
    min-width: 0;
  }
}

@media (max-width: 600px) {
  .chargepoints-management {
    padding: 8px;
  }

  .chargepoints-header {
    padding: 16px;
  }

  .export-actions {
    flex-direction: column;
    gap: 8px;
  }

  .action-buttons-cell {
    flex-direction: column;
    align-items: center;
  }
}

th.k-header.customMenu > div > div > span.k-i-more-vertical::before,
th.k-header.customMenu.active > div > div > span.k-i-more-vertical::before {
  content: '\e129';
}

.k-columnmenu-item {
  display: none;
}

/* Modern Detail Dialog Styles */
.modern-detail-card {
  border-radius: 16px !important;
  overflow: hidden;
  box-shadow: 0 24px 38px 3px rgba(0, 0, 0, 0.14), 0 9px 46px 8px rgba(0, 0, 0, 0.12),
    0 11px 15px -7px rgba(0, 0, 0, 0.2) !important;
}

.detail-card-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 24px 32px 20px;
  position: relative;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-icon {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 8px;
}

.header-text {
  flex: 1;
}

.header-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
  line-height: 1.2;
}

.header-subtitle {
  font-size: 0.875rem;
  opacity: 0.9;
  margin: 4px 0 0;
  font-weight: 400;
}

.close-btn {
  background: rgba(255, 255, 255, 0.1) !important;
  border-radius: 8px !important;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.2) !important;
}

.header-divider {
  border-color: rgba(255, 255, 255, 0.12);
  margin: 0;
}

.detail-content {
  padding: 32px !important;
  background-color: var(--dialog-content-bg);
  min-height: 200px;
}

.detail-actions {
  padding: 20px 32px 24px !important;
  background-color: var(--dialog-content-bg);
  gap: 12px;
}

.action-btn {
  border-radius: 8px !important;
  font-weight: 500 !important;
  text-transform: none !important;
  letter-spacing: normal !important;
  padding: 0 20px !important;
  height: 44px !important;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1) !important;
}

.action-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15) !important;
  transition: all 0.2s ease;
}

.loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 32px;
  background: #fafafa;
}

.loading-text {
  color: rgba(0, 0, 0, 0.6);
  font-size: 0.875rem;
}

.site-details {
  padding: 16px;
}

.site-details .detail-row {
  display: flex;
  margin-bottom: 12px;
  align-items: center;
}

.site-details .detail-label {
  font-weight: 500;
  min-width: 140px;
  color: var(--detail-label-color);
}

.site-details .detail-value {
  flex: 1;
  color: var(--text-primary);
}

.no-data-message {
  padding: 32px;
  text-align: center;
  color: var(--text-secondary);
  font-style: italic;
}

.charging-profiles-header,
.connectors-header {
  padding: 16px;
  border-bottom: 1px solid var(--v-border-color);
  background-color: var(--v-theme-surface-variant);
}
</style>
