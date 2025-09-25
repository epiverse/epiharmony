let webR = null;
let webRReady = false;
let consoleOutput = [];

self.addEventListener('message', async (event) => {
  const { type, code, data, mapping } = event.data;

  switch (type) {
    case 'init':
      await initWebR();
      break;
    case 'execute':
      await executeRCode(code, data, mapping);
      break;
    case 'status':
      self.postMessage({
        type: 'status',
        ready: webRReady,
        message: webRReady ? 'WebR is ready' : 'WebR is loading...'
      });
      break;
  }
});

async function initWebR() {
  if (webRReady) {
    self.postMessage({
      type: 'init',
      success: true,
      message: 'WebR already initialized'
    });
    return;
  }

  try {
    self.postMessage({
      type: 'init',
      status: 'loading',
      message: 'Loading WebR...'
    });

    const { WebR } = await import('https://webr.r-wasm.org/latest/webr.mjs');

    webR = new WebR({
      channelType: 'automatic',
      stdout: (line) => {
        consoleOutput.push({
          type: 'stdout',
          message: line
        });
        self.postMessage({
          type: 'console',
          content: { type: 'stdout', message: line }
        });
      },
      stderr: (line) => {
        consoleOutput.push({
          type: 'stderr',
          message: line
        });
        self.postMessage({
          type: 'console',
          content: { type: 'stderr', message: line }
        });
      }
    });

    await webR.init();
    webRReady = true;

    await webR.evalR(`
      # Set up default options
      options(width = 80)
      options(scipen = 999)

      # Helper function for data frame conversion
      json_to_df <- function(json_str) {
        data <- jsonlite::fromJSON(json_str, simplifyVector = TRUE)
        as.data.frame(data)
      }

      # Helper function to export data frame to JSON
      df_to_json <- function(df) {
        jsonlite::toJSON(df, dataframe = "rows", auto_unbox = TRUE, na = "null")
      }
    `).catch(() => {});

    self.postMessage({
      type: 'init',
      success: true,
      message: 'WebR initialized successfully'
    });

  } catch (error) {
    self.postMessage({
      type: 'init',
      success: false,
      error: error.toString(),
      message: 'Failed to initialize WebR'
    });
  }
}

async function executeRCode(code, data, mapping) {
  if (!webRReady) {
    self.postMessage({
      type: 'result',
      success: false,
      error: 'WebR not initialized',
      message: 'Please wait for WebR to initialize'
    });
    return;
  }

  consoleOutput = [];

  try {
    const jsonData = JSON.stringify(data);

    const setupCode = `
      # Load the data
      input_data_json <- '${jsonData.replace(/'/g, "\\'")}'
      input_data <- tryCatch({
        # Try with jsonlite if available
        if (requireNamespace("jsonlite", quietly = TRUE)) {
          jsonlite::fromJSON(input_data_json, simplifyVector = TRUE)
        } else {
          # Fallback to basic parsing
          # This is a simplified parser and may not work for complex data
          stop("jsonlite package not available. Please install it or use simpler data.")
        }
      }, error = function(e) {
        stop(paste("Error parsing JSON data:", e$message))
      })

      # Convert to data frame if it's not already
      if (!is.data.frame(input_data)) {
        input_data <- as.data.frame(input_data)
      }

      # Make input_data available globally
      .GlobalEnv$data <- input_data

      # User's transformation code
      ${code}

      # Check if transform function exists
      if (!exists("transform")) {
        stop("No transform function defined. Please define a function named 'transform' that takes a row and returns the transformed value(s).")
      }

      # Apply transformation
      transformed_data <- input_data
      n_rows <- nrow(input_data)

      for (i in 1:n_rows) {
        row <- input_data[i, , drop = FALSE]
        result <- tryCatch({
          transform(row)
        }, error = function(e) {
          warning(paste("Error in row", i, ":", e$message))
          NULL
        })

        if (!is.null(result)) {
          # Handle different return types
          if (is.data.frame(result) && nrow(result) == 1) {
            for (col in names(result)) {
              transformed_data[i, col] <- result[[col]]
            }
          } else if (is.list(result) && !is.data.frame(result)) {
            for (name in names(result)) {
              transformed_data[i, name] <- result[[name]]
            }
          } else if (length(result) == 1) {
            # Single value - assign to target column
            target_cols <- c(${mapping.target.map(t => `"${t}"`).join(', ')})
            if (length(target_cols) > 0) {
              transformed_data[i, target_cols[1]] <- result
            }
          }
        }
      }

      # Convert result to JSON
      result_json <- tryCatch({
        if (requireNamespace("jsonlite", quietly = TRUE)) {
          jsonlite::toJSON(transformed_data, dataframe = "rows", auto_unbox = TRUE, na = "null")
        } else {
          # Basic conversion
          "[]"
        }
      }, error = function(e) {
        paste('{"error": "', gsub('"', '\\\\"', e$message), '"}')
      })

      result_json
    `;

    const result = await webR.evalR(setupCode);
    const resultJson = await result.toJs();

    let transformedData;
    try {
      if (typeof resultJson === 'string') {
        const parsed = JSON.parse(resultJson);
        if (parsed.error) {
          throw new Error(parsed.error);
        }
        transformedData = parsed;
      } else {
        transformedData = resultJson;
      }
    } catch (parseError) {
      throw new Error(`Failed to parse transformation result: ${parseError.message}`);
    }

    self.postMessage({
      type: 'result',
      success: true,
      result: {
        data: transformedData,
        console: consoleOutput,
        stats: {
          total: data.length,
          success: transformedData.length,
          errors: data.length - transformedData.length
        }
      },
      mapping: mapping
    });

  } catch (error) {
    self.postMessage({
      type: 'result',
      success: false,
      error: error.toString(),
      stack: error.stack,
      console: consoleOutput,
      mapping: mapping
    });
  }
}

async function checkPackages() {
  if (!webRReady) return [];

  try {
    const result = await webR.evalR('installed.packages()[, "Package"]');
    const packages = await result.toJs();
    return packages;
  } catch (error) {
    console.error('Failed to get installed packages:', error);
    return [];
  }
}

async function installPackage(packageName) {
  if (!webRReady) {
    throw new Error('WebR not initialized');
  }

  try {
    await webR.installPackages([packageName]);
    self.postMessage({
      type: 'package',
      success: true,
      message: `Package ${packageName} installed successfully`
    });
  } catch (error) {
    self.postMessage({
      type: 'package',
      success: false,
      error: error.toString(),
      message: `Failed to install package ${packageName}`
    });
  }
}