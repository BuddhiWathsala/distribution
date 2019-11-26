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

define(['require', 'lodash', 'jquery', 'log', 'ace/ace', 'app/source-editor/editor', 'alerts'],
    function (require, _, $, log, ace, SiddhiEditor, alerts) {

        var TemplateConfigDialog = function (options) {
            this.app = options.app;
            this.templateContainer = options.templateContainer;
            this.config = this.getConfigurationContent();
            this.configEditor;

        };

        TemplateConfigDialog.prototype.constructor = TemplateConfigDialog;

        TemplateConfigDialog.prototype.render = function () {
            var self = this;
            var divId = "configurationEditorId";
            var templateEntry = "<div class='config-template-container' id='".concat(divId).concat("'></div>");
            self.templateContainer.append(templateEntry);

            this._mainEditor = new SiddhiEditor({
                divID: divId,
                realTimeValidation: false,
                autoCompletion: false
            });

            this._editor = ace.edit(divId);
            this._editor.getSession().setValue(self.config);
            this._editor.resize(true);
            self.configEditor = this._editor;
        };

        TemplateConfigDialog.prototype.getConfigurationContent = function () {
            var self = this;
            var configServiceURL = self.app.config.services.deploymentConfigs.endpoint;
            var configContent = "";

            $.ajax({
                url: configServiceURL,
                type: "GET",
                contentType: "text/plain; charset=utf-8",
                async: false,
                success: function (data, textStatus, xhr) {
                    if (xhr.status === 200) {
                        configContent = data.deploymentYaml;
                    } else {
                        alerts.error("Error occured while reading Siddhi Runner configurations." + data.Error);
                    }
                },
                error: function (res, errorCode, error) {
                    var msg = _.isString(error) ? error : res.statusText;
                    if (isJsonString(res.responseText)) {
                        var resObj = JSON.parse(res.responseText);
                        if (_.has(resObj, 'Error')) {
                            msg = _.get(resObj, 'Error');
                        }
                    }
                    alerts.error(msg);
                }
            });
            return configContent;
        };

        function isJsonString(str) {
            try {
                JSON.parse(str);
            } catch (e) {
                return false;
            }
            return true;
        }

        TemplateConfigDialog.prototype.getTemplatedConfig = function () {
            var self = this;
            if (self.configEditor != undefined) {
                return self.configEditor.session.getValue();
            }
        };
        return TemplateConfigDialog;
    });


