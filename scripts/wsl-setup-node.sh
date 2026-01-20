#!/usr/bin/env bash
set -euo pipefail

# Ensure we have a `node` executable inside WSL so shebangs like
# `#!/usr/bin/env node` work when running npm scripts.
# This wrapper uses the Windows Node.js installation via WSL interop.

mkdir -p "$HOME/bin"

cat > "$HOME/bin/node" <<'EOF'
#!/usr/bin/env bash
exec /mnt/c/Program\ Files/nodejs/node.exe "$@"
EOF

chmod +x "$HOME/bin/node"

# Ensure PATH contains ~/bin for current session and future shells
if ! echo ":$PATH:" | grep -q ":$HOME/bin:"; then
  export PATH="$HOME/bin:$PATH"
fi

# Persist (optional) for interactive shells
if ! grep -q "\$HOME/bin" "$HOME/.bashrc" 2>/dev/null; then
  echo '' >> "$HOME/.bashrc"
  echo '# Added by EstateCare for running Node scripts in WSL' >> "$HOME/.bashrc"
  echo 'export PATH="$HOME/bin:$PATH"' >> "$HOME/.bashrc"
fi

echo "WSL node shim ready:"
node -v
npm -v
