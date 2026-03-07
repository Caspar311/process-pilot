import React, { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Checkbox,
  FormGroup,
  FormControlLabel,
  Link,
  Chip,
  Paper,
  CircularProgress,
  Snackbar,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import processData from '../config/process-definition.json'
import { executeWebhook, fetchGet } from '../services/n8nService'

interface ExternalLink {
  label: string
  url_template: string
}

interface ActionButton {
  label: string
  webhook: string
}

interface Step {
  id: string
  label: string
  instruction: string
  ui_element: string
  action_type?: string
  source?: string
  external_link?: ExternalLink
  checklist?: string[]
  text_snippet?: string
  action_button?: ActionButton
}

interface ProcessDefinition {
  process_id: string
  version: string
  title: string
  description: string
  steps: Step[]
}

const data = processData as ProcessDefinition

const FilePickerStep: React.FC<{
  step: Step
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  processPayload: Record<string, any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onDataChange: (stepId: string, data: any) => void
  onError: (msg: string) => void
}> = ({ step, processPayload, onDataChange, onError }) => {
  const [options, setOptions] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!step.source) return
    let isMounted = true

    const fetchOptions = async () => {
      setLoading(true)
      try {
        const result = await fetchGet(step.source!)
        if (isMounted) {
          // Robust mapping: handle both arrays and objects
          let items: any[] = []

          if (Array.isArray(result)) {
            items = result
          } else if (result && typeof result === 'object') {
            // If n8n returns a single object containing an array (e.g. { data: [...] })
            const possibleArray = Object.values(result).find(val => Array.isArray(val))
            if (possibleArray) {
              items = possibleArray as any[]
            } else {
              // Fallback: treat the object itself as a single item
              items = [result]
            }
          }

          setOptions(
            items.map((item: any) => {
              // Try common ID and Name fields, fallback to stringified object if nothing matches
              const id = item.id || item.fileId || item.file_id || String(Math.random())
              const name = item.name || item.filename || item.title || JSON.stringify(item).slice(0, 30)
              return { id, name }
            })
          )
        }
      } catch (err) {
        if (isMounted) {
          onError(err instanceof Error ? err.message : 'Error fetching file list')
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchOptions()
    return () => {
      isMounted = false
    }
  }, [step.source, onError])

  const selectedFileId = processPayload[step.id]?.selectedFileId

  return (
    <Box sx={{ mt: 2 }}>
      {loading ? (
        <Box sx={{ display: 'flex', alignItems: 'center', p: 2 }}>
          <CircularProgress size={24} sx={{ mr: 2 }} />
          <Typography color="text.secondary">Lade Dateien aus Nextcloud...</Typography>
        </Box>
      ) : (
        <FormControl fullWidth variant="outlined">
          <InputLabel id={`select-label-${step.id}`}>Datei auswählen</InputLabel>
          <Select
            labelId={`select-label-${step.id}`}
            value={selectedFileId || ''}
            onChange={(e) => {
              const selectedId = e.target.value as string
              const selectedOption = options.find((o) => o.id === selectedId)
              onDataChange(step.id, {
                selectedFileId: selectedId,
                fileName: selectedOption?.name || selectedId,
              })
            }}
            label="Datei auswählen"
          >
            {options.map((opt) => (
              <MenuItem key={opt.id} value={opt.id}>
                {opt.name}
              </MenuItem>
            ))}
            {options.length === 0 && (
              <MenuItem disabled value="">
                <em>Keine Dateien gefunden</em>
              </MenuItem>
            )}
          </Select>
        </FormControl>
      )}
    </Box>
  )
}

export const ProcessViewer: React.FC = () => {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({})
  const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null)
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success')
  const [isProcessCompleted, setIsProcessCompleted] = useState<boolean>(false)

  // Global payload state to collect data from all steps
  // Using 'any' here locally to allow arbitrary step data structures without excessive TS overhead
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [processPayload, setProcessPayload] = useState<Record<string, any>>({})

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleStepDataChange = (stepId: string, payloadData: any) => {
    setProcessPayload((prev) => ({
      ...prev,
      [stepId]: {
        ...(prev[stepId] || {}),
        ...payloadData,
      },
    }))
  }

  const handleActionClick = async (stepId: string, webhookUrl: string) => {
    setLoadingStates((prev) => ({ ...prev, [stepId]: true }))
    try {
      // Send the entire processPayload along with metadata
      const finalPayload = {
        process_id: data.process_id,
        trigger_step_id: stepId,
        timestamp: new Date().toISOString(),
        process_data: processPayload,
      }

      await executeWebhook(webhookUrl, finalPayload)
      setSnackbarSeverity('success')
      setSnackbarMessage('Aktion erfolgreich ausgeführt.')
      setIsProcessCompleted(true)
    } catch (error) {
      setSnackbarSeverity('error')
      setSnackbarMessage(
        error instanceof Error ? error.message : 'Ein unbekannter Fehler ist aufgetreten.'
      )
    } finally {
      setLoadingStates((prev) => ({ ...prev, [stepId]: false }))
    }
  }

  const handleCloseSnackbar = (_event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return
    }
    setSnackbarMessage(null)
  }

  const renderUIElement = (step: Step) => {
    switch (step.ui_element) {
      case 'file_picker':
        return (
          <FilePickerStep
            step={step}
            processPayload={processPayload}
            onDataChange={handleStepDataChange}
            onError={(msg) => {
              setSnackbarSeverity('error')
              setSnackbarMessage(msg)
            }}
          />
        )
      case 'checklist_view': {
        const checkedItems = processPayload[step.id]?.checkedItems || {}
        return (
          <Box sx={{ mt: 2 }}>
            {step.external_link && (
              <Box sx={{ mb: 2 }}>
                <Link
                  href="#"
                  underline="hover"
                  sx={{ display: 'inline-flex', alignItems: 'center', fontWeight: 'medium' }}
                >
                  <OpenInNewIcon sx={{ fontSize: 20, mr: 0.5 }} />
                  {step.external_link.label}
                </Link>
              </Box>
            )}
            <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.paper' }}>
              <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
                Checkliste:
              </Typography>
              <FormGroup>
                {step.checklist?.map((item, idx) => {
                  const itemKey = `checkbox_${idx}`
                  return (
                    <FormControlLabel
                      key={idx}
                      control={
                        <Checkbox
                          color="primary"
                          checked={!!checkedItems[itemKey]}
                          onChange={(e) =>
                            handleStepDataChange(step.id, {
                              checkedItems: {
                                ...checkedItems,
                                [itemKey]: e.target.checked,
                              },
                              // Also keep a readable list of confirmed items for the payload
                              confirmedChecks: e.target.checked
                                ? [...(processPayload[step.id]?.confirmedChecks || []), item]
                                : (processPayload[step.id]?.confirmedChecks || []).filter(
                                  (i: string) => i !== item
                                ),
                            })
                          }
                        />
                      }
                      label={<Typography variant="body2">{item}</Typography>}
                    />
                  )
                })}
              </FormGroup>
            </Paper>
          </Box>
        )
      }
      case 'action_panel':
        return (
          <Box sx={{ mt: 2 }}>
            {step.text_snippet && (
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  mb: 2,
                  bgcolor: 'action.hover',
                  fontFamily: 'monospace',
                  fontSize: '0.875rem',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {step.text_snippet}
              </Paper>
            )}
            {step.action_button && (
              <Button
                variant="contained"
                color="primary"
                fullWidth
                size="large"
                disableElevation
                sx={{ py: 1.5 }}
                onClick={() => handleActionClick(step.id, step.action_button!.webhook)}
                disabled={loadingStates[step.id]}
                startIcon={
                  loadingStates[step.id] ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : undefined
                }
              >
                {loadingStates[step.id] ? 'Wird übertragen...' : step.action_button.label}
              </Button>
            )}
          </Box>
        )
      default:
        return (
          <Typography color="error" sx={{ mt: 2, fontStyle: 'italic' }}>
            Unknown UI Element: {step.ui_element}
          </Typography>
        )
    }
  }

  return (
    <Box className="max-w-3xl mx-auto p-4 sm:p-6 md:p-8">
      <Box component="header" sx={{ mb: 5, textAlign: { xs: 'center', sm: 'left' } }}>
        <Typography variant="h1" fontWeight="800" gutterBottom>
          {data.title}
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" paragraph>
          {data.description}
        </Typography>
        <Chip
          label={`ID: ${data.process_id} • v${data.version}`}
          size="small"
          variant="filled"
          sx={{ fontFamily: 'monospace', fontWeight: 'medium' }}
        />
      </Box>

      <Box className="space-y-6">
        {isProcessCompleted ? (
          <Card variant="elevation" elevation={2} sx={{ textAlign: 'center', p: { xs: 4, sm: 6 } }}>
            <CardContent>
              <CheckCircleOutlineIcon color="success" sx={{ fontSize: 80, mb: 2 }} />
              <Typography variant="h4" fontWeight="bold" gutterBottom>
                Prozess erfolgreich abgeschlossen!
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                Die Daten wurden erfolgreich verarbeitet und übertragen.
              </Typography>

              {/* Summary Box */}
              <Box
                sx={{
                  mt: 4,
                  mb: 4,
                  p: 3,
                  bgcolor: 'action.hover',
                  borderRadius: 2,
                  display: 'inline-block',
                  textAlign: 'left',
                  minWidth: { xs: '100%', sm: '300px' },
                }}
              >
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  Details der Verarbeitung:
                </Typography>
                <Box
                  component="ul"
                  sx={{ m: 0, pl: 2, typography: 'body2', color: 'text.secondary' }}
                >
                  {Object.entries(processPayload).map(([stepId, stepData]) => {
                    const fname = stepData?.fileName
                    if (fname) {
                      return (
                        <li key={stepId}>
                          <strong>Ausgewählte Datei:</strong> {fname}
                        </li>
                      )
                    }
                    return null
                  })}
                </Box>
              </Box>

              <Box>
                <Button
                  variant="outlined"
                  color="primary"
                  size="large"
                  onClick={() => {
                    setIsProcessCompleted(false)
                    setProcessPayload({})
                  }}
                >
                  Neuen Prozess starten
                </Button>
              </Box>
            </CardContent>
          </Card>
        ) : (
          data.steps.map((step, index) => (
            <Card key={step.id} variant="elevation" elevation={1}>
              <CardContent sx={{ p: { xs: 3, sm: 4 }, '&:last-child': { pb: { xs: 3, sm: 4 } } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box
                    sx={{
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      bgcolor: 'primary.light',
                      color: 'primary.dark',
                      fontWeight: 'bold',
                      mr: 2,
                    }}
                  >
                    {index + 1}
                  </Box>
                  <Typography variant="h5" component="h3" fontWeight="bold">
                    {step.label}
                  </Typography>
                </Box>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                  {step.instruction}
                </Typography>

                {renderUIElement(step)}
              </CardContent>
            </Card>
          ))
        )}
      </Box>

      {/* Global feedback snackbar */}
      <Snackbar
        open={!!snackbarMessage}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbarSeverity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  )
}
