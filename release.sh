 # Check status                                                                                                                                                                                                 
  git status                                                                                                                                                                                                     
                                                                                                                                                                                                                 
  # Stash local settings if needed                                                                                                                                                                               
  git stash push -m "Stash" .claude/settings.local.json                                                                                                                                                          
                                                                                                                                                                                                                 
  # Commit changes                                                                                                                                                                                               
  git add src/cli.ts package.json                                                                                                                                                                                
  git commit -m "Update CLI to copy all templates to project root"                                                                                                                                               
                                                                                                                                                                                                                 
  # Bump version and publish                                                                                                                                                                                     
  npm version patch                                                                                                                                                                                              
  npm run build                                                                                                                                                                                                  
  npm publish             
