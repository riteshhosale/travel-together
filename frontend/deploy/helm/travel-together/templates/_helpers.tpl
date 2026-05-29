{{- define "travel-together.name" -}}
travel-together
{{- end -}}

{{- define "travel-together.fullname" -}}
{{- printf "%s-%s" (include "travel-together.name" .) .Release.Name | trunc 63 | trimSuffix "-" -}}
{{- end -}}
