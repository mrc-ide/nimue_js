FROM rocker/r-ver:4.0.3

# Install R dependencies
RUN apt update && apt install -y libv8-dev libcurl4-openssl-dev

RUN R -e 'install.packages( \
  c("odin", "deSolve", "jsonlite", "remotes"))'

RUN R -e 'Sys.setenv(DOWNLOAD_STATIC_LIBV8 = 1); \
  remotes::install_github(c("jeroen/V8", "mrc-ide/odin.js", \
  "reside-ic/nimue@c2dbf59f7433fddb6e3fb362d8047daa1e14cd01"))'

# Install node
RUN apt install -y curl
RUN curl -sL https://deb.nodesource.com/setup_10.x | bash -
RUN apt install -y nodejs
