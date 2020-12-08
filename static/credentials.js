'use strict'

function FormSerializer(form) {
    this.form = form;
    this.formData = new FormData(this.form);
}

void function(FormSerializer) {

    FormSerializer.entries = function() {
        return Array.from(this.formData.entries());
    };

    FormSerializer.stringify = function() {
        return JSON.stringify(this.entries());
    };

    FormSerializer.set = function(key, val) {
        this.formData.set(key, val);
        this.form.elements[key].value = val;
    };

    FormSerializer.toForm = function() {
        for (var input of this.formData) {
            this.form.elements[input[0]].value = input[1];
        }
    };

    FormSerializer.toFormData = function() {
        for (var input of this.form.elements) {
            this.formData.set(input.name, input.value);
        }
    };

    FormSerializer.post = function(url, cb) {
        var request = new XMLHttpRequest();
        request.open("POST", url);
        request.send(this.formData);
        request.onload = function(oEvent) {
            if (request.status != 200) {
                alert("Error " + request.status + " while trying to upload FormData: " + request.response);
            } else {
                if (typeof cb === 'function') {
                    cb(request);
                }
            }
        };
        return request;
    };

}(FormSerializer.prototype);


$(function () {
    function setCredentials(ev) {
        var formSerializer = new FormSerializer(ev.target);
        var savedForm = formSerializer.stringify();
        // formSerializer.set('username', 'sdv');
        // formSerializer.toForm();
        // formSerializer.toFormData();
        var request = formSerializer.post('/credentials', function(request) {
            drawGraph(800, 800);
        });
        return false;
    }

    $("#credentials").on('submit', setCredentials);
})
