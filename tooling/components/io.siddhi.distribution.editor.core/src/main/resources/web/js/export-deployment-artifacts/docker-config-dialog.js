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

define(['require', 'lodash', 'jquery'],
    function (require, _, $) {

        var DockerConfigDialog = function (options) {
            this.missingDockerConfigErrorMessage = options.templateHeader.find("#missing-docker-config-error-message");
            this.dockerNameInUpperError = options.templateHeader.find("#docker-name-upper-error");
            this.stepDesciption = options.templateHeader.find("#docker-config-description");
            this.container = options.templateHeader;
            this.payload = options.payload;
            this.exportType = options.exportType;
            this.dockerDetailsForm = options.templateHeader.find('#docker-details');
            this.dockerImageName = options.dockerImageName;
        };

        DockerConfigDialog.prototype.constructor = DockerConfigDialog;

        DockerConfigDialog.prototype.render = function () {
            let self = this;
            let dockerDownloadCheckboxInput = self.container.find("#download-docker-artifacts");
            let dockerDownloadCheckboxText = self.container.find("#download-docker-artifacts-label");
            let dockerPushCheckboxInput = self.container.find("#docker-push-checkbox");
            let dockerImageInput = self.container.find("#docker-img-name-input-field-image");
            if (self.dockerImageName != "") {
                dockerImageInput.val(self.dockerImageName);
            }
            if (self.exportType === "kubernetes") {
                dockerPushCheckboxInput.prop('checked', true);
                dockerDownloadCheckboxInput.hide();
                dockerPushCheckboxInput.hide();
                dockerDownloadCheckboxText.hide();
                self.dockerDetailsForm.show();
            } else {
                dockerDownloadCheckboxInput.prop('checked', true);
            }

            self.container.find("#download-docker-artifacts").change(function(event){
                if (event.target.checked){
                    self.stepDesciption.css('opacity', '0.6');
                    self.stepDesciption.css('background-color', 'transparent');
                }
            });

            self.container.find("#docker-push-checkbox").change(function() {
                var pushDocker = self.container.find("#docker-push-checkbox").is(":checked");
                if (!pushDocker) {
                    self.missingDockerConfigErrorMessage.hide();
                    self.dockerNameInUpperError.hide();
                    self.dockerDetailsForm.hide();
                } else {
                    self.dockerDetailsForm.show();
                    self.stepDesciption.css('opacity', '0.6');
                    self.stepDesciption.css('background-color', 'transparent');
                }
            });

            self.container.find("#docker-details").on('input', function() {
                var imageName = self.container.find("#docker-img-name-input-field-registry").val().trim()
                                + "/" + self.container.find("#docker-img-name-input-field-image").val().trim();
                var userName = self.container.find("#username").val();
                var password = self.container.find("#password").val();
                var email = self.container.find("#email").val();
                var pushDocker = self.container.find("#docker-push-checkbox").is(":checked");
                if (pushDocker || self.exportType === "kubernetes") {
                    var upperCase = new RegExp('[A-Z]');
                    if (!imageName.match(upperCase)) {
                        self.dockerNameInUpperError.hide();
                    } else {
                        self.dockerNameInUpperError.show();
                    }
                    if (imageName !== "" && userName !== "" && password !== "" && email !== "") {
                        self.missingDockerConfigErrorMessage.hide();
                    }
                }
            });
        };

        DockerConfigDialog.prototype.getDockerConfigs = function () {
            var self = this;
            var templateKeyValue = {};
            if (self.container.find("#docker-img-name-input-field-registry").val().trim() != "") {
                templateKeyValue["imageName"] = self.container.find("#docker-img-name-input-field-registry").val().trim()
                                                            + "/" + self.container.find("#docker-img-name-input-field-image").val().trim();
            } else {
                templateKeyValue["imageName"] = self.container.find("#docker-img-name-input-field-image").val().trim();
            }

            templateKeyValue["userName"] = self.container.find("#username").val();
            templateKeyValue["password"] = self.container.find("#password").val();
            templateKeyValue["email"] = self.container.find("#email").val();
            templateKeyValue["downloadDocker"] = self.container.find("#download-docker-artifacts").is(":checked");
            templateKeyValue["pushDocker"] = self.container.find("#docker-push-checkbox").is(":checked");
            return templateKeyValue;
        };

        DockerConfigDialog.prototype.validateDockerConfig = function () {
            var self = this;

            var pushDocker = self.container.find("#docker-push-checkbox").is(":checked");
            var downloadArtifacts = self.container.find("#download-docker-artifacts").is(":checked");

            if (!pushDocker && !downloadArtifacts) {
                self.stepDesciption.css('opacity', '1.0');
                self.stepDesciption.css('background-color', '#d9534f !important');
            }

            var registryName = self.container.find("#docker-img-name-input-field-registry").val().trim()
            var imageName = self.container.find("#docker-img-name-input-field-image").val().trim();
            var userName = self.container.find("#username").val();
            var password = self.container.find("#password").val();
            var email = self.container.find("#email").val();
            if (pushDocker || self.exportType === "kubernetes") {

                var upperCase = new RegExp('[A-Z]');
                if (imageName.match(upperCase)) {
                    self.dockerNameInUpperError.show();
                    return false;
                }

                if (registryName === "" || imageName === "" || userName === "" || password === "" || email === "" ||
                    registryName == null || imageName == null || userName == null || password == null || email == null
                ) {
                    self.missingDockerConfigErrorMessage.show();
                    return false;
                }
            }
            return true;
        };

        return DockerConfigDialog;
    });
