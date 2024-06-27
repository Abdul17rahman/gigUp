// Function to turn off flash alert
setTimeout(function () {
  var alert = document.getElementById("alert");
  if (alert) {
    alert.classList.add("fade");
    setTimeout(function () {
      alert.remove();
    }, 150); // Wait for the fade transition to complete before removing the element
  }
}, 3000); // 3000 milliseconds = 3 seconds

// Example starter JavaScript for disabling form submissions if there are invalid fields
(() => {
  "use strict";

  // Fetch all the forms we want to apply custom Bootstrap validation styles to
  const forms = document.querySelectorAll(".validatedForm");

  // Loop over them and prevent submission
  Array.from(forms).forEach((form) => {
    form.addEventListener(
      "submit",
      (event) => {
        if (!form.checkValidity()) {
          event.preventDefault();
          event.stopPropagation();
        }

        form.classList.add("was-validated");
      },
      false
    );
  });
})();
