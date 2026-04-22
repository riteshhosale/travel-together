{{- define "travel-together-grafana.name" -}}
travel-together-grafana
{{- end -}}

{{- define "travel-together-grafana.fullname" -}}
{{- printf "%s-%s" (include "travel-together-grafana.name" .) .Release.Name | trunc 63 | trimSuffix "-" -}}
{{- end -}}
