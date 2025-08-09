{
  inputs = {
    nixpkgs.url = "nixpkgs";
  };

  outputs =
    { self, nixpkgs }:
    let
      systems = [ "x86_64-linux" ];
      forAllSystems = nixpkgs.lib.genAttrs systems;
    in
    {
      devShells = forAllSystems (
        system:
        let
          pkgs = import nixpkgs { system = system; };

          # Dependencies
          dependencies = with pkgs; [
            nodejs_24
            biome
          ];

          # Create script packages from bin/
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
          scripts = builtins.map makeScript scriptNames;
        in
        {
          default = pkgs.mkShell {
            buildInputs = dependencies ++ scripts;

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

              EOF

              git pull
            '';
          };
        }
      );
    };
}
