'use strict';
var axios = require('axios');
var URI = require('urijs');
var _ = require('lodash');

module.exports = function (App) {
    App.prototype.vcsInfos = function () {
        var repoURI = URI(this.repositoryUrl);
        return {
            repo: repoURI.domain(),
            reponame: repoURI.filename().replace('.git', ''),
            username: repoURI.directory().replace('/', ''),
            vcsType: 'github',
        };
    };

    App.getCircleCIProjects = function () {
        var circleURIprojects = `https://circleci.com/api/v1.1/projects?circle-token=${process.env.CIRCLECI_TOKEN}`;
        return axios.get(circleURIprojects).then((response) => response.data);
    };

    App.configureCircleCIProject = function (vcsInfos) {
        var circleURIprojects = `https://circleci.com/api/v1.1/project/${vcsInfos.vcsType}/${vcsInfos.username}/${vcsInfos.reponame}/follow?circle-token=${process.env.CIRCLECI_TOKEN}`;
        return axios.post(circleURIprojects).then((response) => {
            return response.status == 200;
        });
    };

    App.prototype.configureCI = function (done) {
        var vcs = this.vcsInfos();
        var self = this;
        App.getCircleCIProjects()
            .then((projects) => {
                var project = _.find(projects, { vcs_url: this.repositoryUrl.replace('.git', '') });
                if (!project) {
                    return App.configureCircleCIProject(vcs).then((projectConfigurated) => {
                        return self;
                    });
                } else {
                    return self;
                }
            })
            .then((project) => {
                done(null, project);
            })
            .catch((error) => {
                console.error(error);
                done({ statusCode: 500, name: 'CIError', message: 'CircleCI Error (Try again)' });
            });
    };
};
