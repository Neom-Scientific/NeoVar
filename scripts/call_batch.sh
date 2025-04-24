#!/bin/bash

sample_script="$(readlink -f "$1")"
sample_dir="$(readlink -f "$2")"
output_dir="$(readlink -f "$3")"
target="$(readlink -f "$4")"
target_interval="$(readlink -f "$5")"


CYG_PATH()
{
    if command -v cygpath &> /dev/null
    then 
        eval $1="$(cygpath -a -u "$2")"
    fi
}

CYG_PATH sample_dir "$sample_dir"
CYG_PATH output_dir "$output_dir"
CYG_PATH sample_script "$sample_script"
CYG_PATH target "$target"
CYG_PATH target_interval "$target_interval"

if [ -z "$output_dir" ]; then
 echo "The output directory can not be empty. "
 echo ""
 echo "Correct Usage"
 echo "./call_batch.sh <sample_script> <input_dir> <output_dir> <target> <target_interval>"
 exit 1;

fi


cat <<EOF

## The input directory is:
$sample_dir

## The output directory will be:
$output_dir

EOF



read -ep "Press enter to continue"
mkdir -p "$output_dir"


#The fastq files for each sample are next to each other when listed alphabetically
find "${sample_dir}" \(  \
	-name '*.fastq'  -o \
	-name '*.fq' -o \
	-name '*.fq.gz' -o \
	-name '*.fastq.gz' \
	\) -exec readlink -f {} \; | grep -v "Undetermined" | sort | paste - - | while read line
do
    read -r -a files <<< "$line"

    r1_file="${files[0]}"
    r2_file="${files[1]}" 

    ## Parse the sample name out of the file name 
    # Find common name 
    sample="$(printf "%s\n" "${files[@]}" | sed -e '$!{N;s/^\(.*\).*\n\1.*$/\1\n\1/;D;}')"
    # Remove trailing special chars (_, etc)
    sample="$(echo "$sample" | rev | cut -d '/' -f 1 | rev | sed 's/^\(.*[a-zA-Z0-9]\).*$/\1/' )"

    echo "sampleName: ${sample}"
    echo "$r1_file" "$r2_file" 

    mkdir -p "${output_dir}/${sample}"

    "$sample_script" "${output_dir}/${sample}" "$sample" "$r1_file" "$r2_file" "$target" "$target_interval"
done;


