args = commandArgs(trailingOnly=TRUE)
if (length(args) != 2) {
  stop("This script requires the model spec and the output path")
}
if (packageVersion("odin.js") < "0.1.11") {
  stop("Upgrade odin.js to at least 0.1.11")
}
odin.js::odin_js_bundle(
  file.path(
    system.file('odin', package = 'nimue', mustWork = TRUE),
    args[1]
  ),
  args[2]
)
