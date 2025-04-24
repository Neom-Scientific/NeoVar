#!/bin/bash

number_of_threads=8

NeoVar_Dir="$(cd "$(dirname "$0")" && realpath ./bin)"
NeoVar_Resources="$(cd "$(dirname "$0")" && realpath ./resources)"

reference="$NeoVar_Resources/Homo_sapiens_assembly38.fasta"
dbsnp="$NeoVar_Resources/Homo_sapiens_assembly38.dbsnp138.vcf"
gold_indels="$NeoVar_Resources/Mills_and_1000G_gold_standard.indels.hg38.vcf.gz"
BAIT_INTERVALS="$6"
TARGET_INTERVALS="$6"
INTERVAL_FILE="$5"
genelist="$NeoVar_Resources/geneTrack.refSeq"

gatk="$NeoVar_Dir/gatk-4.6.1.0/gatk"
picard="$NeoVar_Dir/picard.jar"
samtools="$NeoVar_Dir/samtools-1.21/samtools"
bwa="$NeoVar_Dir/bwa-0.7.19/bwa"
fastqc="$NeoVar_Dir/fastqc_v0.12.1/FastQC/fastqc"
trimmomatic="$NeoVar_Dir/Trimmomatic-0.39/trimmomatic-0.39.jar"

sample="$2"
group="$2"
platform="illumina"

fastq1="$3"
fastq2="$4"

output_dir="$1"
mkdir -p "$output_dir"
cd "$output_dir"

echo "# ******************************************"
echo "# Mapping reads with BWA-MEM, sorting"
echo "# ******************************************"

$bwa mem \
    -M \
    -R "@RG\tID:$group\tSM:$sample\tPL:$platform" \
    -t $number_of_threads \
    -K 10000000 \
    "$reference" \
    "$fastq1" \
    "$fastq2" \
    | \
$samtools sort \
    -@ $number_of_threads \
    -o "${sample}_sorted.bam"
 
echo "Alignment Pipeline Completed Successfully!"
    
echo "# ******************************************"
echo "# Running QC analysis for $sample..."
echo "# ******************************************"  

echo "1️⃣ Mean Quality by Cycle"
java -jar $picard MeanQualityByCycle \
    I="${sample}_sorted.bam" \
    O="$output_dir/${sample}_mq_metrics.txt" \
    CHART="$output_dir/${sample}_mq_chart.pdf"

echo "2️⃣ Quality Score Distribution"
java -jar $picard QualityScoreDistribution \
    I="${sample}_sorted.bam" \
    O="$output_dir/${sample}_qd_metrics.txt" \
    CHART="$output_dir/${sample}_qd_chart.pdf"

echo "3️⃣ GC Bias Metrics"
java -jar $picard CollectGcBiasMetrics \
    I="${sample}_sorted.bam" \
    O="$output_dir/${sample}_gc_metrics.txt" \
    CHART="$output_dir/${sample}_gc_chart.pdf" \
    S="$output_dir/${sample}_gc_summary.txt" \
    R="$reference"

echo "4️⃣ Insert Size Metrics"
java -jar $picard CollectInsertSizeMetrics \
    I="${sample}_sorted.bam" \
    O="$output_dir/${sample}_insert_size_metrics.txt" \
    H="$output_dir/${sample}_insert_size_histogram.pdf"

echo "5️⃣ Alignment Statistics"
$samtools flagstat "${sample}_sorted.bam" > "$output_dir/${sample}_alignment_stats.txt"
$samtools stats "${sample}_sorted.bam" > "$output_dir/${sample}_alignment_stats_full.txt"
$samtools idxstats "${sample}_sorted.bam" > "$output_dir/${sample}_alignment_idxstats.txt"

echo "QC report generated"

echo "# ******************************************"
echo "# Remove Duplicate Reads"
echo "# ******************************************"

echo "1️⃣: Mark Duplicates"
java -jar $picard MarkDuplicates \
    I="${sample}_sorted.bam" \
    O="${sample}_dedup.bam" \
    M="$metrics_file" \
    REMOVE_DUPLICATES=true \
    ASSUME_SORTED=true \
    VALIDATION_STRINGENCY=LENIENT

echo "2️⃣: Index the BAM file"
$samtools index "${sample}_dedup.bam"

echo "3️⃣: Clean up original BAM to save space"
rm "${sample}_sorted.bam" || echo "Couldn't remove sorted BAM"

echo "Deduplication completed. Output BAM: ${sample}_dedup.bam"

echo "# ******************************************"
echo "# Running Coverage for $sample..."
echo "# ******************************************"  

echo "1️⃣ Compute Depth of Coverage at Specific Thresholds"
$gatk DepthOfCoverage \
   -R $reference \
   -I ${sample}_dedup.bam \
   -O ${sample}_coverage.txt \
   -L "$INTERVAL_FILE" \
   --summary-coverage-threshold 1 \
   --summary-coverage-threshold 10 \
   --summary-coverage-threshold 20 \
   --summary-coverage-threshold 30 \

echo "2️⃣ Hybrid Selection (Exome) Metrics"
java -jar $picard CollectHsMetrics \
    I="${sample}_dedup.bam" \
    O="${sample}_dedup_hsmetrices.txt" \
    R="$reference" \
    BAIT_INTERVALS="$BAIT_INTERVALS" \
    TARGET_INTERVALS="$TARGET_INTERVALS"

echo "# ******************************************"
echo "# Variant calling"
echo "# ******************************************"

echo "1️⃣ Variant Calling using GATK HaplotypeCaller"
$gatk HaplotypeCaller \
    -R "$reference" \
    -L "$INTERVAL_FILE" \
    -I "${sample}_dedup.bam" \
    -D $dbsnp \
    -O "${sample}_tmp.gvcf.gz" \
    -ERC GVCF \
    --native-pair-hmm-threads $number_of_threads

echo "Variant calling completed. Output: ${sample}_tmp.gvcf.gz"

echo "2️⃣ Convert GVCF to VCF using GenotypeGVCFs"
$gatk GenotypeGVCFs \
    -R "$reference" \
    -V "${sample}_tmp.gvcf.gz" \
    -O "${sample}_tmp.vcf.gz"

echo "GVCF conversion completed. Output: ${sample}_tmp.vcf.gz"
rm "${sample}_tmp.gvcf.gz" || echo "Couldn't remove sorted gvcf"
rm "${sample}_tmp.gvcf.gz.tbi" || echo "Couldn't remove sorted gvcf"

echo "3️⃣ Variant Filtering using GATK VariantFiltration"
$gatk VariantFiltration \
    -R "$reference" \
    -V "${sample}_tmp.vcf.gz" \
    -O "${sample}_filtered.vcf.gz" \
    --filter-expression "QD < 2.0 || FS > 60.0 || MQ < 40.0" \
    --filter-name "LowQuality" \
    --filter-expression "DP < 10" \
    --filter-name "LowDepth"
    
 echo "VCF filtering completed. Output: ${sample}_filtered.vcf.gz"
  






