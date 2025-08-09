{
  inputs = {
    nixpkgs.url = "nixpkgs";
  };

  outputs =
    { self, nixpkgs }:
    let
      systems = [ "x86_64-linux" ];
      forAllSystems = nixpkgs.lib.genAttrs systems;

      # Function to create script packages
      makeScriptPackages =
        { pkgs, dependencies }:
        let
          makeScript =
            name:
            let
              baseScript = pkgs.writeScriptBin name (builtins.readFile ./bin/${name});
              patchedScript = baseScript.overrideAttrs (old: {
                buildCommand = "${old.buildCommand}\n patchShebangs $out";
              });
            in
            pkgs.symlinkJoin {
              name = name;
              paths = [ patchedScript ] ++ dependencies;
              buildInputs = [ pkgs.makeWrapper ];
              postBuild = ''
                wrapProgram $out/bin/${name} --prefix PATH : $out/bin
              '';
            };
          scriptNames = builtins.attrNames (builtins.readDir ./bin);
        in
        nixpkgs.lib.genAttrs scriptNames makeScript;

      # Function to set up the common environment for a system
      makeEnvForSystem =
        system:
        let
          pkgs = import nixpkgs { system = system; };

          # Default dependencies for packages
          defaultDependencies = with pkgs; [ nodejs_23 ];

          # Extended dependencies for development
          devDependencies = defaultDependencies ++ (with pkgs; [ biome ]);
        in
        {
          inherit pkgs;

          # For packages
          packageEnv = {
            inherit pkgs;
            dependencies = defaultDependencies;
            scriptPackages = makeScriptPackages {
              inherit pkgs;
              dependencies = defaultDependencies;
            };
          };

          # For dev shells
          devEnv = {
            inherit pkgs;
            dependencies = devDependencies;
            scriptPackages = makeScriptPackages {
              inherit pkgs;
              dependencies = devDependencies;
            };
            scriptPackageList = builtins.attrValues (makeScriptPackages {
              inherit pkgs;
              dependencies = devDependencies;
            });
          };
        };
    in
    {
      packages = forAllSystems (
        system:
        let
          env = makeEnvForSystem system;
          inherit (env.packageEnv)
            pkgs
            dependencies
            scriptPackages
            ;

          sitePackage = pkgs.stdenv.mkDerivation {
            name = "chobble-template";
            src = ./.;
            buildInputs = dependencies;

            buildPhase = ''
              mkdir -p $TMPDIR/build_dir
              cd $TMPDIR/build_dir

              cp -r $src/* .
              cp $src/.eleventy.js .

              npm install

              mkdir -p src/_data
              chmod -R +w src/_data

              ${scriptPackages.build}/bin/build
            '';

            installPhase = ''
              mkdir -p $out
              mv $TMPDIR/build_dir/_site $out/
            '';

            dontFixup = true;
          };

          allPackages = {
            site = sitePackage;
          } // scriptPackages;
        in
        allPackages
      );

      defaultPackage = forAllSystems (system: self.packages.${system}.site);

      devShells = forAllSystems (
        system:
        let
          env = makeEnvForSystem system;
          inherit (env.devEnv)
            pkgs
            dependencies
            scriptPackages
            scriptPackageList
            ;
        in
        {
          default = pkgs.mkShell {
            buildInputs = dependencies ++ scriptPackageList;

            shellHook = ''
              npm install
              cat <<EOF

              Development environment ready!

              Available commands:
               - 'serve'      - Start development server
               - 'build'      - Build the site in the _site directory
               - 'dryrun'     - Perform a dry run build
               - 'test_flake' - Test building a site using flake.nix
               - 'test_js'    - Run all JavaScript tests
               - 'lint'       - Lint all files in src using Biome

              EOF

              git pull
            '';
          };
        }
      );
    };
}
