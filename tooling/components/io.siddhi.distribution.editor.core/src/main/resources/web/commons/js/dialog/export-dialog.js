/**
 * Copyright (c) 2019, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 * WSO2 Inc. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

define(['require', 'jquery', 'log', 'backbone', 'smart_wizard', 'siddhiAppSelectorDialog', 'jarsSelectorDialog',
        'templateAppDialog', 'templateConfigDialog', 'fillTemplateValueDialog', 'kubernetesConfigDialog',
        'dockerConfigDialog'],
    function (require, $, log, Backbone, smartWizard, SiddhiAppSelectorDialog, JarsSelectorDialog,
              TemplateAppDialog, TemplateConfigDialog, FillTemplateValueDialog, KubernetesConfigDialog, DockerConfigDialog) {

        var ExportDialog = Backbone.View.extend(
            /** @lends ExportDialog.prototype */
            {
                /**
                 * @augments Backbone.View
                 * @constructs
                 * @class ExportDialog
                 * @param {Object} options exportContainerModal
                 * @param {boolean} isExportDockerFlow  is Docker File Export
                 */
                initialize: function (options, isExportDockerFlow) {
                    this._options = options;
                    var exportDialog = _.cloneDeep(_.get(options.config, 'export_dialog'));
                    this._exportContainer = $(_.get(exportDialog, 'selector')).clone();

                    this._isExportDockerFlow = isExportDockerFlow;
                    this._payload = {
                        templatedSiddhiApps: [],
                        configuration: '',
                        templatedVariables: [],
                        bundles: [],
                        jars: [],
                        kubernetesConfiguration: '',
                        dockerConfiguration: ''
                    };
                    this._siddhiAppSelector;
                    this._jarsSelectorDialog;
                    this._appTemplatingModel;
                    this._configTemplateModel;
                    this._kubernetesConfigModel;
                    this._fill_template_value_dialog;
                    this._dockerConfigModel;
                    this._exportUrl;
                    this._exportType;

                    if (isExportDockerFlow) {
                        this._exportType = 'docker';
                    } else {
                        this._exportType = 'kubernetes';
                    }
                    this._exportUrl = options.config.baseUrl + "/export?exportType=" + this._exportType;
                    this._btnExportForm =  $('' +
                        '<form id="submit-form" method="post" enctype="application/x-www-form-urlencoded" target="export-download" >' +
                        '<button  type="button" class="btn btn-primary hidden" id="export-btn" data-dismiss="modal" >Export</button>' +
                        '</form>');

                },

                show: function () {
                    this._exportContainer.modal('show');
                },

                render: function () {
                    var self = this;
                    var isExportDockerFlow = this._isExportDockerFlow;
                    var options = this._options;

                    var exportContainer = this._exportContainer;
                    var heading = exportContainer.find('#initialHeading');
                    var form = exportContainer.find('#export-form');

                    if (isExportDockerFlow) {
                        heading.text('Export Siddhi Apps for Docker image');
                    } else {
                        heading.text('Export Siddhi Apps For Kubernetes CRD');
                        form.find('#form-steps')
                            .append('<li><a href="#step-7">Step 7<br/><small>Add Kubernetes Config</small></a></li>');

                        form.find('#form-containers')
                            .append(
                                '<div id="step-7" class="export-selector">' +
                                '<div class="kubernetes-configuration-step" id="kubernetes-configuration-step-id">' +
                                '<div class="step-description">Configure Kubernetes for Siddhi</div>' +
                                '<div>' +
                                '<div class="form-group">' +
                                '<div class="clearfix">Siddhi Process Name:</div>' +
                                '<input type="text" class="form-control" id="sp-name-input-field" placeholder="sample-siddhi-process">' +
                                '</div>' +
                                '<div class="form-group">' +
                                '<div class="clearfix">Deployment types:</div>' +
                                '<div>' +
                                '<div class="clearfix">Distributed/Non-distributed</div>' +
                                '<div class="clearfix"><input type="radio" id="non-distributed" value="non-distributed"> Non distributed deployment</div>' +
                                '<div class="clearfix"><input type="radio" id="distributed-with-nats" value="distributed-with-nats"> Distributed deployment with NATS</div>' +
                                '<div class="clearfix">' +
                                '   <div><input type="radio" id="distributed-with-ext-nats" value="distributed-with-ext-nats"> Distributed deployment with External NATS<div>' +
                                '   <div class="messaging-config-template-container kubernetes-config-editor" hidden id="kubernetes-messaging-editor-id"></div>' +
                                '</div>' +
                                '</div>' +
                                '</div>' +
                                '<div class="form-group">' +
                                '<div class="clearfix">Persistence Storage:</div>' +
                                '<div class="clearfix"><input type="radio" name="persistence" id="stateless" value="stateless"> Stateless</div>' +
                                '<div class="clearfix">' +
                                '<div class="clearfix"><input type="radio" name="persistence" id="backed-by-pv" value="backed-by-pv"> Backed by Persistent Volume</div>' +
                                '<div class="messaging-config-template-container kubernetes-config-editor" hidden id="kubernetes-pv-editor-id"></div>' +
                                '</div>' +
                                '</div>' +
                                '</div>' +
                                '</div>' +
                                '</div>');
                    }

                    // Toolbar extra buttons
                    var btnExportForm = this._btnExportForm;
                    btnExportForm.find('#export-btn').on('click', function () {
                        self.sendExportRequest()
                    });

                    form.smartWizard({
                        selected: 0,
                        keyNavigation: false,
                        autoAdjustHeight: false,
                        theme: 'default',
                        transitionEffect: 'slideleft',
                        showStepURLhash: false,
                        contentCache: false,
                        toolbarSettings: {
                            toolbarPosition: 'bottom',
                            toolbarExtraButtons: [btnExportForm]
                        }
                    });

                    self._siddhiAppSelector = new SiddhiAppSelectorDialog(options, form);
                    self._siddhiAppSelector.render();

                    // Initialize the leaveStep event - validate before next
                    form.on("leaveStep", function (e, anchorObject, stepNumber, stepDirection) {
                        if (stepDirection === 'forward') {
                            if (stepNumber === 0) {
                                return self._siddhiAppSelector.validateSiddhiAppSelection();
                            }
                            if (stepNumber === 1) {
                                self._payload.templatedSiddhiApps = self._appTemplatingModel.getTemplatedApps();
                            }
                            if (stepNumber === 2) {
                                self._payload.configuration = self._configTemplateModel.getTemplatedConfig();
                                self._payload.templatedSiddhiApps = self._appTemplatingModel.getTemplatedApps();
                            } else if (stepNumber === 3) {
                                self._payload.templatedVariables = self._fill_template_value_dialog.
                                getTemplatedKeyValues();
                                return self._fill_template_value_dialog.
                                validateTemplatedValues(self._payload.templatedVariables)
                            }
                        }
                    });

                    // Step is passed successfully
                    form.on("showStep", function (e, anchorObject, stepNumber, stepDirection, stepPosition) {
                        // Finish button enable/disable
                        if (stepPosition === 'first') {
                            $(".sw-btn-prev").addClass('disabled');
                            $(".sw-btn-prev").addClass('hidden');
                            $(".sw-btn-prev").parent().removeClass("sw-btn-group-final");
                        } else if (stepPosition === 'final') {
                            $(".sw-btn-next").addClass('hidden disabled');
                            $(".sw-btn-next").parent().addClass("sw-btn-group-final");
                            $("#export-btn").removeClass('hidden');
                        } else {
                            $(".sw-btn-next").removeClass('disabled');
                            $(".sw-btn-next").removeClass('hidden');
                            $(".sw-btn-prev").removeClass('disabled');
                            $(".sw-btn-prev").removeClass('hidden');
                            $(".sw-btn-prev").parent().removeClass("sw-btn-group-final");
                            $("#export-btn").addClass('hidden');
                        }

                        if (stepDirection === 'forward') {
                            if (stepNumber === 1) {
                                var siddhiAppTemplateContainer
                                    = exportContainer.find('#siddhi-app-template-container-id');
                                if (siddhiAppTemplateContainer.children().length > 0) {
                                    siddhiAppTemplateContainer.empty();
                                    siddhiAppTemplateContainer.accordion("destroy");
                                }
                                var siddhiAppsNamesList = self._siddhiAppSelector.getSiddhiApps();
                                var templateOptions = {
                                    app: self._options,
                                    siddhiAppNames: siddhiAppsNamesList,
                                    templateContainer: siddhiAppTemplateContainer
                                };
                                self._appTemplatingModel = new TemplateAppDialog(templateOptions);
                                self._appTemplatingModel.render();
                            } else if (stepNumber === 2) {
                                var templateStep = exportContainer.find('#config-template-container-id');
                                if (templateStep.children().length > 0) {
                                    templateStep.empty();
                                }
                                self._configTemplateModel = new TemplateConfigDialog({
                                    app: self._options,
                                    templateContainer: templateStep
                                });
                                self._configTemplateModel.render();
                            } else if (stepNumber === 4) {
                                self._jarsSelectorDialog = new JarsSelectorDialog(options, form);
                                self._jarsSelectorDialog.render();
                            } else if (stepNumber === 3) {
                                var fillTemplateContainer
                                    = exportContainer.find('#fill-template-container-id');
                                if (fillTemplateContainer.children().length > 0) {
                                    fillTemplateContainer.empty();
                                }
                                var fillTemplateOptions = {
                                    container: fillTemplateContainer,
                                    payload: self._payload
                                };
                                self._fill_template_value_dialog = new FillTemplateValueDialog(fillTemplateOptions);
                                self._fill_template_value_dialog.render();
                            } else if (stepNumber === 5) {
                                self._dockerConfigModel = new DockerConfigDialog({
                                    app: self._options,
                                    templateHeader: exportContainer.find('#docker-config-container-id'),
                                    payload: self._payload
                                });
                                self._dockerConfigModel.render();
                            } else if (stepNumber === 6) {
                                self._kubernetesConfigModel = new KubernetesConfigDialog({
                                    app: self._options,
                                    templateHeader: exportContainer.find('#kubernetes-configuration-step-id')
                                });
                                self._kubernetesConfigModel.render();
                            }
                        }
                    });

                    this._exportContainer = exportContainer;
                },

                sendExportRequest: function () {
                    if (!this._isExportDockerFlow) {
                        this._payload.kubernetesConfiguration = this._kubernetesConfigModel.getKubernetesConfigs();
                    }
                    this._payload.dockerConfiguration = this._dockerConfigModel.getDockerConfigs();
                    this._payload.bundles = this._jarsSelectorDialog.getSelected('bundles');
                    this._payload.jars = this._jarsSelectorDialog.getSelected('jars');

                    var payloadInputField = $('<input id="payload" name="payload" type="text" style="display: none;"/>')
                        .attr('value', JSON.stringify(this._payload));
                    this._btnExportForm.append(payloadInputField);

                    $(document.body).append(this._btnExportForm);
                    var exportUrl = this._exportUrl
                    var requestType = ""
                    if (this._payload.dockerConfiguration.downloadDocker && !this._payload.dockerConfiguration.pushDocker) {
                        requestType = "downloadOnly";
                        exportUrl = exportUrl + "&requestType=" + requestType;
                    } else if (!this._payload.dockerConfiguration.downloadDocker && this._payload.dockerConfiguration.pushDocker && (this._exportType == "docker")) {
                        requestType = "buildOnly";
                        exportUrl = exportUrl + "&requestType=" + requestType;
                        $.ajax({
                            type: "POST",
                            url: exportUrl,
                            headers: {
                                "Content-Type": "application/x-www-form-urlencoded"
                             },
                            data: {"payload": JSON.stringify(this._payload)},
                            async: false,
                            success: function (response) {
                                result = {status: "success"};
                            },
                            error: function (error) {
                                if (error.responseText) {
                                    result = {status: "fail", errorMessage: error.responseText};
                                } else {
                                    result = {status: "fail", errorMessage: "Error Occurred while processing your request"};
                                }
                            }
                        });
                        return;
                    }
                    this._btnExportForm = this._btnExportForm.attr('action', exportUrl)
                    this._btnExportForm.submit();
                },

                clear: function () {
                    if (!_.isNil(this._exportContainer)) {
                        this._exportContainer.remove();
                    }
                    if (!_.isNil(this._btnExportForm)) {
                        this._btnExportForm.remove();
                    }
                }
            });
        return ExportDialog;
    });
