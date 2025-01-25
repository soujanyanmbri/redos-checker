# Redos Checker

1. This Github Action crawls through the following files, gets the regexes and passes them through the redos checker. 
2. Note: This runs only newly added regexes. 
    - .conf (modsec-crs-conf between '@rx and '\ )
    - .java
    - .py
    - OPTIONAL : Add .dat files as well. (Cant work with the new crs-toolchain, hence modsec-crs-rules.conf)

3. Option 3: Static ananlysis on the side to go through all the regexes in the repo


Runn: node cli.js /Users/soujanyanamburi/Projects/test/my_js_project
