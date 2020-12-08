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

}(FormSerializer.prototype);


$(function () {
    function setCredentials(ev) {
        var formSerializer = new FormSerializer(ev.target);
        var savedForm = formSerializer.stringify();
        formSerializer.set('username', 'sdv');
        formSerializer.toForm();
        formSerializer.toFormData();
        return false;
    }

    $("#credentials").on('submit', setCredentials);
})
